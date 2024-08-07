import EventEmitter from "events";

const createLogger = () => ({
  info: (message) =>
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message) =>
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message) =>
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
});

const logger = createLogger();

const createCronJob = () => {
  const emitter = new EventEmitter();
  const jobs = new Map();
  let timer = null;
  const history = [];
  const failed = Set();
  let isPaused = false;
  const eventsEnum = {
    jobAdded: "jobAdded",
    jobDeleted: "jobDeleted",
    jobFailed: "jobFailed",
    jobSuccess: "jobSuccess",
    jobPaused: "jobPaused",
    jobResumed: "jobResumed",
    jobRun: "jobRun",
    jobStopped: "jobStopped",
  };

  /**
   * Schedules a new job with the given jobName, function, and cron expression.
   *
   * @param {string} jobName - The name of the job.
   * @param {function} func - The function to be executed by the job.
   * @param {string} cronExpression - The cron expression that determines when the job should run.
   * @throws {Error} If a job with the same name already exists.
   * @return {string} The name of the scheduled job.
   * @throws {Error} If a job with the same name already exists.
   * @return {string} The name of the scheduled job.
   * @example schedule('job1', () => console.log('Hello, world!'), ' * * * * *')
   */
  const schedule = (jobName, func, cronExpression) => {
    if (jobs.has(jobName)) {
      throw new Error(`Job ${jobName} already exists`);
    }
    jobs.set(jobName, {
      func,
      cronExpression,
      lastRun: null,
      nextRun: calculateNextRun(cronExpression),
      isActive: true,
    });
    logger.info(
      `Job: ${jobName} created with cron expression: ${cronExpression}`
    );

    emitter.emit(eventsEnum.jobAdded, jobName);
    return jobName;
  };

  /**
   * Returns an array of all the keys in the 'jobs' Map.
   *
   * @return {Array} An array of strings representing the keys in the 'jobs' Map.
   */
  const list = () => {
    return Array.from(jobs.keys());
  };

  /**
   * Returns an array containing all the failed jobs.
   *
   * @return {Array} An array of failed jobs.
   */
  const getFailedJobs = () => {
    return Array.from(failed);
  };

  /**
   * Retrieves the history of previous job executions.
   *
   * @return {Array} An array containing the history of previous job executions.
   */
  const getHistory = () => {
    return history;
  };

/**
 * Deletes an existing job with the given jobName.
 *
 * @param {string} jobName - The name of the job to be deleted.
 * @return {void} This function does not return anything.
 */
  const deleteExistingJobs = (jobName) => {
    logger.info(`Job: ${jobName} deleted`);
    jobs.delete(jobName);

    emitter.emit(eventsEnum.jobDeleted, jobName);
  };

  const runNow = (jobName) => {
    if(!jobs.has(jobName)) {
      throw new Error(`Job ${jobName} doesn't exist`);
    }
    const job = jobs.get(jobName);
    if (!job.isActive) {
        logger.info(`Job: ${jobName} is not active`);
      return;
    }
    try {
        logger.info(`Job: ${jobName} started`);
        job.func();
        job.lastRun = new Date();
        logger.info(`Job: ${jobName} completed`);
        history.push({
            name: jobName,
            time: job.lastRun.toISOString(),
            status: "success",
        })
        emitter.emit(eventsEnum.jobSuccess, jobName);
    } catch (error) {
        failed.add(jobName);
        history.push({
            name: jobName,
            time: new Date().toISOString(),
            status: "failed",
        })
        logger.error(`Job: ${jobName} failed`);
        emitter.emit(eventsEnum.jobFailed, jobName);
    }
  };

  const start = () => {
    if(timer) {
        logger.warn(`Cron job already running`);
        return;
    }

    timer = setInterval(() => checkJobDetails(), 1000);
    isPaused = false;
    logger.info("Cron job scheduler started. Jobs will now run automatically.");
    emitter.emit(eventsEnum.jobRun);
  };

/**
 * Stops the cron job scheduler if it is currently running.
 *
 * @return {void} This function does not return anything.
 */
  const stop = () => {
    if(timer){
        clearInterval(timer);
        timer = null;
        isPaused = true;
        logger.info("Cron job scheduler stopped. Jobs will not run automatically.");
        emitter.emit(eventsEnum.jobStopped);
    }else{
        logger.warn(`Cron job already stopped`);
    }
  };

/**
 * Pauses the cron job scheduler if it is currently running.
 *
 * @return {void} This function does not return anything.
 */
  const pause = () => {
    if(!timer) {
        logger.warn(`Cron job already stopped`);
        return;
    }
    clearInterval(timer);
    timer = null;
    isPaused = true;
    logger.info("Cron job scheduler paused. Jobs will not run automatically.");
    emitter.emit(eventsEnum.jobPaused);
  };

/**
 * Resumes the cron job scheduler if it is currently paused and running.
 *
 * @return {void} This function does not return anything.
 */
  const resume = () => {
    if (!timer) {
      logger.warn("Cron job scheduler is not running. Use start() to begin.");
      return;
    }
    if (!isPaused) {
      logger.warn("Cron job scheduler is not paused");
      return;
    }
    isPaused = false;
    logger.info("Cron job scheduler resumed. Jobs will run automatically.");
    emitter.emit('resumed');
  };

/**
 * Checks all jobs and runs the ones that are active and have reached their next run date.
 *
 * @return {void} This function does not return anything.
 */
  const checkJobs = () => {
    if (isPaused) return;
    const now = new Date();
    jobs.forEach((job, jobName) => {
      if (job.isActive && now >= job.nextRun) {
        runNow(jobName);
        job.nextRun = calculateNextRun(job.cronExpression);
      }
    });
  };

/**
 * Calculates the next run date based on a cron expression.
 *
 * @param {string} cronExpression - The cron expression in the format "minute hour dayOfMonth month dayOfWeek".
 * @return {Date} The next run date.
 */
  const calculateNextRun = (cronExpression) => {
    // Helper function to parse cron fields
    const parseCronField = (field, min, max) => {
      if (field === '*') return Array.from({length: max - min + 1}, (_, i) => i + min);
      return field.split(',').map(item => {
        if (item.includes('-')) {
          const [start, end] = item.split('-').map(Number);
          return Array.from({length: end - start + 1}, (_, i) => i + start);
        }
        return parseInt(item, 10);
      }).flat().filter(num => !isNaN(num) && num >= min && num <= max).sort((a, b) => a - b);
    };
  
    // Parse cron expression
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ').map((field, index) => {
      const ranges = [
        [0, 59],  // minute
        [0, 23],  // hour
        [1, 31],  // day of month
        [1, 12],  // month
        [0, 6]    // day of week
      ];
      return parseCronField(field, ...ranges[index]);
    });
  
    const getNextDate = (currentDate, field, getUnit, setUnit, addUnit) => {
      let nextDate = new Date(currentDate);
      let currentValue = getUnit(nextDate);
      let nextValue = field.find(value => value > currentValue);
      
      if (nextValue !== undefined) {
        setUnit(nextDate, nextValue);
      } else {
        setUnit(nextDate, field[0]);
        addUnit(nextDate, 1);
      }
      
      return nextDate;
    };
  
    const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const getDaysInMonth = (year, month) => [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  
    let now = new Date();
    let nextRun = new Date(now);
    nextRun.setSeconds(0, 0);
  
    while (true) {
      nextRun = getNextDate(nextRun, minute, d => d.getMinutes(), (d, v) => d.setMinutes(v), (d, v) => d.setHours(d.getHours() + v));
      if (nextRun > now) break;
  
      nextRun = getNextDate(nextRun, hour, d => d.getHours(), (d, v) => d.setHours(v), (d, v) => d.setDate(d.getDate() + v));
      if (nextRun > now) break;
  
      const validDays = dayOfMonth.filter(d => d <= getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth()));
      nextRun = getNextDate(nextRun, validDays, d => d.getDate(), (d, v) => d.setDate(v), (d, v) => d.setMonth(d.getMonth() + v));
      if (nextRun > now) break;
  
      nextRun = getNextDate(nextRun, month, d => d.getMonth() + 1, (d, v) => d.setMonth(v - 1), (d, v) => d.setFullYear(d.getFullYear() + v));
      if (nextRun > now) break;
  
      const daysToAdd = dayOfWeek.map(d => (d - nextRun.getDay() + 7) % 7).sort((a, b) => a - b)[0];
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      if (nextRun > now) break;
  
      // If we've looped through all fields and haven't found a future date, add a minute and try again
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    }
  
    return nextRun;
  };
};

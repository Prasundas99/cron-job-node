import EventEmitter from "events";
import { createLogger } from "./utils/logger.js";
import { eventsEnum } from "./utils/constants.js";
import { calculateNextRun } from "./utils/calculateNextRun.js";

const logger = createLogger();

/**
 * Creates a cron job scheduler.
 * @returns {Object} An object containing methods to manage cron jobs.
 */
export const cronJob = () => {
  const emitter = new EventEmitter();
  const jobs = new Map();
  let timer = null;
  const history = [];
  const failed = new Set();
  let isPaused = false;

  /**
   * Schedules a new job with the given jobName, function, and cron expression.
   *
   * @param {string} jobName - The name of the job.
   * @param {function} func - The function to be executed by the job.
   * @param {string} cronExpression - The cron expression that determines when the job should run.
   * @throws {Error} If a job with the same name already exists.
   * @returns {string} The name of the scheduled job.
   * @example
   * const cronJob = createCronJob();
   * cronJob.schedule('dailyBackup', () => console.log('Performing daily backup'), '0 0 * * *');
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
   * Returns an array of all the scheduled job names.
   *
   * @returns {string[]} An array of strings representing the names of scheduled jobs.
   * @example
   * const cronJob = createCronJob();
   * cronJob.schedule('job1', () => console.log('Job 1'), '* * * * *');
   * cronJob.schedule('job2', () => console.log('Job 2'), '0 0 * * *');
   * console.log(cronJob.list()); // ['job1', 'job2']
   */
  const list = () => {
    return Array.from(jobs.keys());
  };

  /**
   * Returns an array containing all the failed jobs.
   *
   * @returns {string[]} An array of failed job names.
   * @example
   * const cronJob = createCronJob();
   * cronJob.schedule('failingJob', () => { throw new Error('Failed job'); }, '* * * * *');
   * cronJob.runNow('failingJob');
   * console.log(cronJob.getFailedJobs()); // ['failingJob']
   */
  const getFailedJobs = () => {
    return Array.from(failed);
  };

  /**
   * Retrieves the history of previous job executions.
   *
   * @returns {Array<{name: string, time: string, status: string}>} An array containing the history of previous job executions.
   * @example
   * const cronJob = createCronJob();
   * cronJob.schedule('testJob', () => console.log('Test'), '* * * * *');
   * cronJob.runNow('testJob');
   * console.log(cronJob.getHistory());
   * // [{name: 'testJob', time: '2023-06-10T12:00:00.000Z', status: 'success'}]
   */
  const getHistory = () => {
    return history;
  };

  /**
   * Deletes an existing job with the given jobName.
   *
   * @param {string} jobName - The name of the job to be deleted.
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * cronJob.schedule('tempJob', () => console.log('Temporary job'), '* * * * *');
   * cronJob.deleteExistingJobs('tempJob');
   */
  const deleteExistingJobs = (jobName) => {
    logger.info(`Job: ${jobName} deleted`);
    jobs.delete(jobName);

    emitter.emit(eventsEnum.jobDeleted, jobName);
  };

  /**
   * Runs a job immediately.
   *
   * @param {string} jobName - The name of the job to run.
   * @throws {Error} If the job doesn't exist.
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * cronJob.schedule('urgentJob', () => console.log('Urgent task'), '0 0 * * *');
   * cronJob.runNow('urgentJob');
   */
  const runNow = (jobName) => {
    if (!jobs.has(jobName)) {
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
      });
      emitter.emit(eventsEnum.jobSuccess, jobName);
    } catch (error) {
      failed.add(jobName);
      history.push({
        name: jobName,
        time: new Date().toISOString(),
        status: "failed",
      });
      logger.error(`Job: ${jobName} failed`);
      emitter.emit(eventsEnum.jobFailed, jobName);
    }
  };

  /**
   * Starts the cron job scheduler if it is not already running.
   *
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * cronJob.schedule('dailyJob', () => console.log('Daily task'), '0 0 * * *');
   * cronJob.start();
   */
  const start = () => {
    if (timer) {
      logger.warn(`Cron job already running`);
      return;
    }

    timer = setInterval(() => checkJobs(), 1000);
    isPaused = false;
    logger.info("Cron job scheduler started. Jobs will now run automatically.");
    emitter.emit(eventsEnum.jobRun);
  };

  /**
   * Stops the cron job scheduler if it is currently running.
   *
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * cronJob.start();
   * // ... some time later
   * cronJob.stop();
   */
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      isPaused = true;
      logger.info(
        "Cron job scheduler stopped. Jobs will not run automatically."
      );
      emitter.emit(eventsEnum.jobStopped);
    } else {
      logger.warn(`Cron job already stopped`);
    }
  };

  /**
   * Pauses the cron job scheduler if it is currently running.
   *
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * cronJob.start();
   * // ... some time later
   * cronJob.pause();
   */
  const pause = () => {
    if (!timer) {
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
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * cronJob.start();
   * cronJob.pause();
   * // ... some time later
   * cronJob.resume();
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
    emitter.emit("resumed");
  };

  /**
   * Adds an event listener for a specific event.
   *
   * @param {string} eventName - The name of the event to listen for.
   * @param {function} listener - The callback function to execute when the event occurs.
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * cronJob.on('jobFailed', (jobName) => {
   *   console.log(`Job ${jobName} has failed`);
   * });
   */
  const on = (eventName, listener) => {
    emitter.on(eventName, listener);
  };

  /**
   * Removes an event listener for a specific event.
   *
   * @param {string} eventName - The name of the event to remove the listener from.
   * @param {function} listener - The callback function to remove.
   * @returns {void}
   * @example
   * const cronJob = createCronJob();
   * const logFailure = (jobName) => console.log(`Job ${jobName} has failed`);
   * cronJob.on('jobFailed', logFailure);
   * // ... later
   * cronJob.off('jobFailed', logFailure);
   */
  const off = (eventName, listener) => {
    emitter.off(eventName, listener);
  };

  /**
   * Checks all jobs and runs the ones that are active and have reached their next run date.
   *
   * @returns {void}
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

  return {
    schedule,
    list,
    getFailedJobs,
    getHistory,
    deleteExistingJobs,
    runNow,
    start,
    stop,
    pause,
    resume,
    on,
    off,
  };
};

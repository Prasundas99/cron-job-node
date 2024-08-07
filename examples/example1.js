import cronJob from "../index.js";

const {schedule, list, runNow, on, off, deleteExistingJobs} = cronJob();

schedule("test", () => console.log("test"), "0 0 * * *");
schedule("test2", () => console.log("Job running for test2"), "0 0 * * *");

list();
runNow("test2");


on("jobAdded", (jobName) => {
    console.log(`-----------------Job ${jobName} added-----------------------`);
});

off("jobAdded", (jobName) => {
    console.log(`--------------------Job ${jobName} removed---------------------`);
});

schedule("test4", () => console.log("test"), "0 0 * * *");
schedule("test3", () => console.log("Job running for test2"), "0 0 * * *");

deleteExistingJobs("test32")
# cron-job-node-js

A flexible and efficient cron job scheduler for Node.js applications.

## Table of Contents

- [cron-job-node-js](#cron-job-node-js)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [In ES6](#in-es6)
  - [Demo Examples](#demo-examples)
  - [In common JS:](#in-common-js)
- [API](#api)
- [Events](#events)
- [Design Pattern](#design-pattern)
  - [When to Use](#when-to-use)
- [Contributing](#contributing)
- [License](#license)

## Introduction

`cron-job-node-js` is a lightweight, easy-to-use cron job scheduler for Node.js. It allows you to schedule tasks to run at specific times or intervals, manage job execution, and react to job-related events.

## Features

- Schedule jobs using cron expressions
- Start, stop, pause, and resume the scheduler
- Run jobs on-demand
- Track job history and failed jobs
- Event-driven architecture for extensibility
- Logging capabilities

## Installation

```bash
npm install cron-job-node-js
```

## Usage
Here's a basic example of how to use cron-job-node-js:

## In ES6

```
import cronJob from "cron-job-node-js"; 

// Create a new instance of the cron job scheduler
const scheduler = cronJob();

// Define sample job functions
const backupJob = () => console.log('Performing daily backup');
const reportJob = () => console.log('Generating daily report');
const cleanupJob = () => console.log('Cleaning up old files');

// Schedule jobs
scheduler.schedule('dailyBackup', backupJob, '0 0 * * *'); // Daily at midnight
scheduler.schedule('dailyReport', reportJob, '0 1 * * *'); // Daily at 1 AM
scheduler.schedule('cleanup', cleanupJob, '0 2 * * *'); // Daily at 2 AM

// List scheduled jobs
console.log('Scheduled Jobs:', scheduler.list()); // ['dailyBackup', 'dailyReport', 'cleanup']

// Run a job immediately
scheduler.runNow('dailyBackup');

// Get the list of failed jobs (should be empty initially)
console.log('Failed Jobs:', scheduler.getFailedJobs()); // []

// Get job history
console.log('Job History:', scheduler.getHistory()); // []

// Delete an existing job
scheduler.deleteExistingJobs('cleanup');

// List scheduled jobs after deletion
console.log('Scheduled Jobs after deletion:', scheduler.list()); // ['dailyBackup', 'dailyReport']

// Start the scheduler
scheduler.start();

// Pause the scheduler
scheduler.pause();

// Resume the scheduler
scheduler.resume();

// Stop the scheduler
scheduler.stop();

// Add event listeners
scheduler.on('jobSuccess', (jobName) => {
  console.log(`Job ${jobName} completed successfully`);
});
scheduler.on('jobFailed', (jobName) => {
  console.log(`Job ${jobName} failed`);
});
scheduler.on('jobAdded', (jobName) => {
  console.log(`Job ${jobName} was added`);
});
scheduler.on('jobDeleted', (jobName) => {
  console.log(`Job ${jobName} was deleted`);
});
scheduler.on('jobStopped', () => {
  console.log('Scheduler stopped');
});
scheduler.on('jobPaused', () => {
  console.log('Scheduler paused');
});
scheduler.on('jobRun', () => {
  console.log('Scheduler running jobs');
});
scheduler.on('jobResumed', () => {
  console.log('Scheduler resumed');
});

// Remove event listeners
const logFailure = (jobName) => console.log(`Job ${jobName} has failed`);
scheduler.off('jobFailed', logFailure);

// Get available events
console.log('Available Events:', scheduler.getEvents());
```



## Demo Examples
```
import CronJob from 'cron-job-node-js';

// Initialize the cron job instance
const cronJob = new CronJob();

// Schedule a job to run every minute
cronJob.schedule('logTime', () => {
  console.log('Current time:', new Date().toISOString());
}, '* * * * *');

// Start the scheduler
cronJob.start();

// Listen for job success events
cronJob.on('jobSuccess', (jobName) => {
  console.log(`Job ${jobName} completed successfully`);
});

// Run a job immediately
cronJob.runNow('logTime');

// Stop the scheduler after 5 minutes
setTimeout(() => {
  cronJob.stop();
  console.log('Scheduler stopped');
}, 5 * 60 * 1000);
```

## In common JS:

```
const cronJob = require('cron-job-node-js');

const cronJob = cronJob();

// Schedule a job to run every minute
cronJob.schedule('logTime', () => {
  console.log('Current time:', new Date().toISOString());
}, '* * * * *');

// Start the scheduler
cronJob.start();

// Listen for job success events
cronJob.on('jobSuccess', (jobName) => {
  console.log(`Job ${jobName} completed successfully`);
});

// Run a job immediately
cronJob.runNow('logTime');

// Stop the scheduler after 5 minutes
setTimeout(() => {
  cronJob.stop();
  console.log('Scheduler stopped');
}, 5 * 60 * 1000);
```


# API

- `schedule(jobName, func, cronExpression)`: Schedule a new job
- `list()`: Get a list of all scheduled jobs
- `getFailedJobs()`: Get a list of failed jobs
- `getHistory()`: Get the execution history of jobs
- `deleteExistingJobs(jobName)`: Delete a scheduled job
- `runNow(jobName)`: Run a job immediately
- `start()`: Start the scheduler
- `stop()`: Stop the scheduler
- `pause()`: Pause the scheduler
- `resume()`: Resume the scheduler
- `on(eventName, listener)`: Add an event listener
- `off(eventName, listener)`: Remove an event listener
- `getEvents()`: Get a list of all available events

# Events

- `jobAdded`: Emitted when a new job is added
- `jobDeleted`: Emitted when a job is deleted
- `jobFailed`: Emitted when a job fails
- `jobSuccess`: Emitted when a job completes successfully
- `jobPaused`: Emitted when the scheduler is paused
- `jobResumed`: Emitted when the scheduler is resumed
- `jobRun`: Emitted when the scheduler starts running
- `jobStopped`: Emitted when the scheduler is stopped

# Design Pattern
cron-job-node-js uses the Observer pattern through Node.js's EventEmitter. This allows for loose coupling between the scheduler and any code reacting to job events.

## When to Use
Use cron-job-node-js when you need to:

- Schedule recurring tasks in your Node.js application
- Run background jobs at specific times
- Implement a task scheduler with minimal setup
- React to job execution events for logging or custom behaviors
- Manage and monitor scheduled tasks programmatically

# Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

# License
This project is licensed under the MIT License - see the LICENSE.md file for details.


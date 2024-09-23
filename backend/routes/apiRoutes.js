const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const { diag, DiagConsoleLogger, DiagLogLevel, DiagLogger } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");

const fs = require('fs');
const path = require('path');

// Custom FileLogger without extending DiagLogger
class FileLogger {
  constructor(filePath) {
    this.logFile = path.resolve(filePath);
  }

  logToFile(level, message, obj) {
    const timestamp = new Date().toISOString();
    message = message.replace(/\n/g, " ");
    const logEntry = `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(obj)}\n`;
    fs.appendFileSync(this.logFile, logEntry, { encoding: 'utf8' });
  }

  debug(message, obj = {}) {
    if (message.toString().toLowerCase().includes("prometheus")) {
      // Let's skip the prometheus debug logs for now
      // They end up polluting our log file
      return;
    }
    this.logToFile('debug', message, obj);
  }

  info(message, obj = {}) {
    this.logToFile('info', message, obj);
  }

  warn(message, obj = {}) {
    this.logToFile('warn', message, obj);
  }

  error(message, obj = {}) {
    this.logToFile('error', message, obj);
  }
}

// Example usage
const logger = new FileLogger('otel_app.log');

// Set the custom file logger as the OpenTelemetry logger
diag.setLogger(logger, DiagLogLevel.DEBUG);

const prometheusExporter = new PrometheusExporter({
  startServer: true,
  port: 9464,
  host: '0.0.0.0',
  endpoint: 'metrics',
  appendTimestamp: false,
}, () => {
  console.log('Prometheus scrape endpoint http://0.0.0.0:9464/metrics');
});

const meterProvider = new MeterProvider({
  exporter: prometheusExporter,
  interval: 1000,
});
// meterProvider.addMetricReader(prometheusExporter)
const meter = meterProvider.getMeter('default');

const jobPostCounter = meter.createCounter('job_post_requests', {
  description: 'Count of job post requests'
});
const jobPostErrorCounter = meter.createCounter('job_post_errors', {
  description: 'Count of job post errors'
});

const jobGetCounter = meter.createCounter('job_get_requests', {
  description: 'Count of job get requests'
});
const jobGetErrorCounter = meter.createCounter('job_get_errors', {
  description: 'Count of job get errors'
});

const jobInfoGetCounter = meter.createCounter('job_info_get_requests', {
  description: 'Count of job info get requests'
});
const jobInfoGetErrorCounter = meter.createCounter('job_info_get_errors', {
  description: 'Count of job info get errors'
});

const jobUpdateCounter = meter.createCounter('job_update_requests', {
  description: 'Count of job update requests'
});
const jobUpdateErrorCounter = meter.createCounter('job_update_errors', {
  description: 'Count of job update errors'
});

const jobDeleteCounter = meter.createCounter('job_delete_requests', {
  description: 'Count of job delete requests'
});
const jobDeleteErrorCounter = meter.createCounter('job_delete_errors', {
  description: 'Count of job delete errors'
});

const userGetCounter = meter.createCounter('user_get_requests', {
  description: 'Count of user get requests'
});
const userGetErrorCounter = meter.createCounter('user_get_errors', {
  description: 'Count of user get errors'
});

const userIdGetCounter = meter.createCounter('user_id_get_requests', {
  description: 'Count of user ID get requests'
});
const userIdGetErrorCounter = meter.createCounter('user_id_get_errors', {
  description: 'Count of user ID get errors'
});

const userUpdateCounter = meter.createCounter('user_update_requests', {
  description: 'Count of user update requests'
});
const userUpdateErrorCounter = meter.createCounter('user_update_errors', {
  description: 'Count of user update errors'
});

const jobApplicationPostCounter = meter.createCounter('job_application_post_requests', {
  description: 'Count of job application post requests'
});
const jobApplicationPostErrorCounter = meter.createCounter('job_application_post_errors', {
  description: 'Count of job application post errors'
});

const jobApplicationsGetCounter = meter.createCounter('job_applications_get_requests', {
  description: 'Count of job applications get requests'
});
const jobApplicationsGetErrorCounter = meter.createCounter('job_applications_get_errors', {
  description: 'Count of job applications get errors'
});

const applicationsGetCounter = meter.createCounter('applications_get_requests', {
  description: 'Count of applications get requests'
});
const applicationsGetErrorCounter = meter.createCounter('applications_get_errors', {
  description: 'Count of applications get errors'
});

const applicationUpdateCounter = meter.createCounter('application_update_requests', {
  description: 'Count of application update requests'
});
const applicationUpdateErrorCounter = meter.createCounter('application_update_errors', {
  description: 'Count of application update errors'
});

const applicantsGetCounter = meter.createCounter('applicants_get_requests', {
  description: 'Count of applicants get requests'
});
const applicantsGetErrorCounter = meter.createCounter('applicants_get_errors', {
  description: 'Count of applicants get errors'
});

const ratingUpdateCounter = meter.createCounter('rating_update_requests', {
  description: 'Count of rating update requests'
});
const ratingUpdateErrorCounter = meter.createCounter('rating_update_errors', {
  description: 'Count of rating update errors'
});

const ratingGetCounter = meter.createCounter('rating_get_requests', {
  description: 'Count of rating get requests'
});
const ratingGetErrorCounter = meter.createCounter('rating_get_errors', {
  description: 'Count of rating get errors'
});

const router = express.Router();

router.post("/jobs", jwtAuth, (req, res) => {
  jobPostCounter.add(1);
  const user = req.user;
  diag.debug(`User attempting to add job. userId: ${user._id}, userType: ${user.type}`, {method: "POST", route: "/jobs"});

  if (user.type != "recruiter") {
    jobPostErrorCounter.add(1);
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    diag.error(`User ${user._id} is not a recruiter. Can't add jobs.`, {method: "POST", route: "/jobs", status: 401});
    return;
  }

  const data = req.body;
  diag.debug(`Job data received: ${data}`, {method: "POST", route: "/jobs"});

  let job = new Job({
    userId: user._id,
    title: data.title,
    maxApplicants: data.maxApplicants,
    maxPositions: data.maxPositions,
    dateOfPosting: data.dateOfPosting,
    deadline: data.deadline,
    skillsets: data.skillsets,
    jobType: data.jobType,
    duration: data.duration,
    salary: data.salary,
    rating: data.rating,
  });

  job
    .save()
    .then(() => {
      diag.debug(`Job added successfully: ${job._id}`, {method: "POST", route: "/jobs", status: 200});
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      jobPostErrorCounter.add(1);
      diag.error(`Error adding job: ${err}`, {method: "POST", route: "/jobs", status: 400});
      res.status(400).json(err);
    });
});

router.get("/jobs", jwtAuth, (req, res) => {
  jobGetCounter.add(1);
  let user = req.user;
  diag.debug(`User fetching jobs. userId: ${user._id}, userType: ${user.type}`, {method: "GET", route: "/jobs"});

  let findParams = {};
  let sortParams = {};

  if (user.type === "recruiter" && req.query.myjobs) {
    findParams = {
      ...findParams,
      userId: user._id,
    };
  }

  if (req.query.q) {
    findParams = {
      ...findParams,
      title: {
        $regex: new RegExp(req.query.q, "i"),
      },
    };
  }

  if (req.query.jobType) {
    let jobTypes = [];
    if (Array.isArray(req.query.jobType)) {
      jobTypes = req.query.jobType;
    } else {
      jobTypes = [req.query.jobType];
    }
    diag.debug(`Job types filter applied: ${jobTypes}`, {method: "GET", route: "/jobs"});
    findParams = {
      ...findParams,
      jobType: {
        $in: jobTypes,
      },
    };
  }

  if (req.query.salaryMin && req.query.salaryMax) {
    findParams = {
      ...findParams,
      $and: [
        {
          salary: {
            $gte: parseInt(req.query.salaryMin),
          },
        },
        {
          salary: {
            $lte: parseInt(req.query.salaryMax),
          },
        },
      ],
    };
  } else if (req.query.salaryMin) {
    findParams = {
      ...findParams,
      salary: {
        $gte: parseInt(req.query.salaryMin),
      },
    };
  } else if (req.query.salaryMax) {
    findParams = {
      ...findParams,
      salary: {
        $lte: parseInt(req.query.salaryMax),
      },
    };
  }

  if (req.query.duration) {
    findParams = {
      ...findParams,
      duration: {
        $lt: parseInt(req.query.duration),
      },
    };
  }

  if (req.query.asc) {
    if (Array.isArray(req.query.asc)) {
      req.query.asc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: 1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.asc]: 1,
      };
    }
  }

  if (req.query.desc) {
    if (Array.isArray(req.query.desc)) {
      req.query.desc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: -1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.desc]: -1,
      };
    }
  }

  diag.debug(`Find parameters: ${findParams}`, {method: "GET", route: "/jobs"});
  diag.debug(`Sort parameters: ${sortParams}`, {method: "GET", route: "/jobs"});

  let arr = [
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "userId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    { $match: findParams },
  ];

  if (Object.keys(sortParams).length > 0) {
    arr = [
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "userId",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      { $match: findParams },
      {
        $sort: sortParams,
      },
    ];
  }

  diag.debug(`Aggregation pipeline: ${arr}`, {method: "GET", route: "/jobs"});

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        jobGetErrorCounter.add(1);
        diag.warn('No jobs found', {method: "GET", route: "/jobs", status: 404});
        res.status(404).json({
          message: "No job found",
        });
        return;
      }
      diag.debug(`Jobs found: ${posts.length}`, {method: "GET", route: "/jobs", status: 200});
      res.json(posts);
    })
    .catch((err) => {
      jobGetErrorCounter.add(1);
      diag.error(`Error fetching jobs: ${err}`, {method: "GET", route: "/jobs", status: 400});
      res.status(400).json(err);
    });
});

router.get("/jobs/:id", jwtAuth, (req, res) => {
  jobInfoGetCounter.add(1);
  diag.debug(`Fetching job info. jobId: ${req.params.id}`, {method: "GET", route: "/jobs/id"});
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        jobInfoGetErrorCounter.add(1);
        diag.warn(`Job does not exist. jobId: ${req.params.id}`, {method: "GET", route: "/jobs/id", status: 400});
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      diag.debug(`Job found: ${job}`, {method: "GET", route: "/jobs/id", status: 200});
      res.json(job);
    })
    .catch((err) => {
      jobInfoGetErrorCounter.add(1);
      diag.error(`Error fetching job info: ${err}`, {method: "GET", route: "/jobs/id", status: 400});
      res.status(400).json(err);
    });
});

router.put("/jobs/:id", jwtAuth, (req, res) => {
  jobUpdateCounter.add(1);
  const user = req.user;
  diag.debug(`User attempting to update job. userId: ${user._id}, jobId: ${req.params.id}`, {method: "PUT", route: "/jobs/id"});

  if (user.type != "recruiter") {
    jobUpdateErrorCounter.add(1);
    diag.error(`User ${user._id} is not a recruiter. Can't update jobs.`, {method: "PUT", route: "/jobs/id", status: 401});
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    return;
  }
  Job.findOne({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job == null) {
        jobUpdateErrorCounter.add(1);
        diag.warn(`Job does not exist for update. jobId: ${req.params.id}`, {method: "PUT", route: "/jobs/id", status: 400});
        res.status(404).json({
          message: "Job does not exist",
        });
        return;
      }
      const data = req.body;
      diag.debug(`Job update data: ${data}`, {method: "PUT", route: "/jobs/id"});

      if (data.maxApplicants) {
        job.maxApplicants = data.maxApplicants;
      }
      if (data.maxPositions) {
        job.maxPositions = data.maxPositions;
      }
      if (data.deadline) {
        job.deadline = data.deadline;
      }
      job
        .save()
        .then(() => {
          diag.debug(`Job details updated successfully. jobId: ${job._id}`, {method: "PUT", route: "/jobs/id", status: 200});
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          jobUpdateErrorCounter.add(1);
          diag.error(`Error updating job details: ${err}`, {method: "PUT", route: "/jobs/id", status: 400});
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      jobUpdateErrorCounter.add(1);
      diag.error(`Error finding job for update: ${err}`, {method: "PUT", route: "/jobs/id", status: 400});
      res.status(400).json(err);
    });
});

router.delete("/jobs/:id", jwtAuth, (req, res) => {
  jobDeleteCounter.add(1);
  const user = req.user;
  diag.debug(`User attempting to delete job. userId: ${user._id}, jobId: ${req.params.id}`, {method: "DELETE", route: "/jobs/id"});

  if (user.type != "recruiter") {
    jobDeleteErrorCounter.add(1);
    diag.error(`User ${user._id} is not a recruiter. Can't delete jobs.`, {method: "DELETE", route: "/jobs/id", status: 401});
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    return;
  }
  Job.findOneAndDelete({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job === null) {
        jobDeleteErrorCounter.add(1);
        diag.warn(`Job not found for deletion. jobId: ${req.params.id}`, {method: "DELETE", route: "/jobs/id", status: 400});
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      diag.debug(`Job deleted successfully. jobId: ${req.params.id}`, {method: "DELETE", route: "/jobs/id", status: 200});
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      jobDeleteErrorCounter.add(1);
      diag.error(`Error deleting job: ${err}`, {method: "DELETE", route: "/jobs/id", status: 400});
      res.status(400).json(err);
    });
});

router.get("/user", jwtAuth, (req, res) => {
  userGetCounter.add(1);
  const user = req.user;
  diag.debug(`Fetching personal details for user. userId: ${user._id}`, {method: "GET", route: "/user"});

  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          userGetErrorCounter.add(1);
          diag.warn(`Recruiter not found. userId: ${user._id}`, {method: "GET", route: "/user", status: 404});
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug(`Recruiter details found. userId: ${user._id}`, {method: "GET", route: "/user", status: 200});
        res.json(recruiter);
      })
      .catch((err) => {
        userGetErrorCounter.add(1);
        diag.error(`Error fetching recruiter details: ${err}`, {method: "GET", route: "/user", status: 400});
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          userGetErrorCounter.add(1);
          diag.warn(`Job applicant not found. userId: ${user._id}`, {method: "GET", route: "/user", status: 404});
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug(`Job applicant details found. userId: ${user._id}`, {method: "GET", route: "/user", status: 200});
        res.json(jobApplicant);
      })
      .catch((err) => {
        userGetErrorCounter.add(1);
        diag.error(`Error fetching job applicant details: ${err}`, {method: "GET", route: "/user", status: 400});
        res.status(400).json(err);
      });
  }
});

router.get("/user/:id", jwtAuth, (req, res) => {
  userIdGetCounter.add(1);
  diag.debug(`Fetching user details by ID. userId: ${req.params.id}`, {method: "GET", route: "/user/id"});
  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        userIdGetErrorCounter.add(1);
        diag.warn(`User not found by ID. userId: ${req.params.id}`, {method: "GET", route: "/user/id", status: 404});
        res.status(404).json({
          message: "User does not exist",
        });
        return;
      }

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              userIdGetErrorCounter.add(1);
              diag.warn(`Recruiter not found by user ID. userId: ${userData._id}`, {method: "GET", route: "/user/id", status: 404});
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.debug(`Recruiter details found by user ID. userId: ${userData._id}`, {method: "GET", route: "/user/id", status: 200});
            res.json(recruiter);
          })
          .catch((err) => {
            userIdGetErrorCounter.add(1);
            diag.error(`Error fetching recruiter details by user ID: ${err}`, {method: "GET", route: "/user/id", status: 400});
            res.status(400).json(err);
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              userIdGetErrorCounter.add(1);
              diag.warn(`Job applicant not found by user ID. userId: ${userData._id}`, {method: "GET", route: "/user/id", status: 404});
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.debug(`Job applicant details found by user ID. userId: ${userData._id}`, {method: "GET", route: "/user/id", status: 200});
            res.json(jobApplicant);
          })
          .catch((err) => {
            userIdGetErrorCounter.add(1);
            diag.error(`Error fetching job applicant details by user ID: ${err}`, {method: "GET", route: "/user/id", status: 400});
            res.status(400).json(err);
          });
      }
    })
    .catch((err) => {
      userIdGetErrorCounter.add(1);
      diag.error(`Error fetching user by ID: ${err}`, {method: "GET", route: "/user/id", status: 400});
      res.status(400).json(err);
    });
});

router.put("/user", jwtAuth, (req, res) => {
  userUpdateCounter.add(1);
  const user = req.user;
  const data = req.body;
  diag.debug(`User attempting to update personal details. userId: ${user._id}`, {method: "PUT", route: "/user"});

  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          userUpdateErrorCounter.add(1);
          diag.warn(`Recruiter not found for update. userId: ${user._id}`, {method: "PUT", route: "/user", status: 404});
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug(`Recruiter update data: ${data}`, {method: "PUT", route: "/user"});

        if (data.name) {
          recruiter.name = data.name;
        }
        if (data.contactNumber) {
          recruiter.contactNumber = data.contactNumber;
        }
        if (data.bio) {
          recruiter.bio = data.bio;
        }
        recruiter
          .save()
          .then(() => {
            diag.debug(`Recruiter details updated successfully. userId: ${user._id}`, {method: "PUT", route: "/user", status: 200});
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            userUpdateErrorCounter.add(1);
            diag.error(`Error updating recruiter details: ${err}`, {method: "PUT", route: "/user", status: 400});
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        userUpdateErrorCounter.add(1);
        diag.error(`Error finding recruiter for update: ${err}`, {method: "PUT", route: "/user", status: 400});
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          userUpdateErrorCounter.add(1);
          diag.warn(`Job applicant not found for update. userId: ${user._id}`, {method: "PUT", route: "/user", status: 404});
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug(`Job applicant update data: ${data}`, {method: "PUT", route: "/user"});

        if (data.name) {
          jobApplicant.name = data.name;
        }
        if (data.education) {
          jobApplicant.education = data.education;
        }
        if (data.skills) {
          jobApplicant.skills = data.skills;
        }
        if (data.resume) {
          jobApplicant.resume = data.resume;
        }
        if (data.profile) {
          jobApplicant.profile = data.profile;
        }
        diag.debug(`Job applicant details before save. userId: ${user._id}`, {method: "PUT", route: "/user"});
        jobApplicant
          .save()
          .then(() => {
            diag.debug(`Job applicant details updated successfully. userId: ${user._id}`, {method: "PUT", route: "/user", status: 200});
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            userUpdateErrorCounter.add(1);
            diag.error(`Error updating job applicant details: ${err}`, {method: "PUT", route: "/user", status: 400});
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        userUpdateErrorCounter.add(1);
        diag.error(`Error finding job applicant for update: ${err}`, {method: "PUT", route: "/user", status: 400});
        res.status(400).json(err);
      });
  }
});

router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  jobApplicationPostCounter.add(1);
  const user = req.user;
  diag.debug(`User attempting to apply for job. userId: ${user._id}, jobId: ${req.params.id}`, {method: "POST", route: "/jobs/id/applications"});

  if (user.type != "applicant") {
    jobApplicationPostErrorCounter.add(1);
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    return;
  }
  const data = req.body;
  const jobId = req.params.id;
  diag.debug(`Application data received: ${data}`, {method: "POST", route: "/jobs/id/applications"});

  Application.findOne({
    userId: user._id,
    jobId: jobId,
    status: {
      $nin: ["deleted", "accepted", "cancelled"],
    },
  })
    .then((appliedApplication) => {
      diag.debug(`Previous application check: ${appliedApplication}`, {method: "POST", route: "/jobs/id/applications"});
      if (appliedApplication !== null) {
        jobApplicationPostErrorCounter.add(1);
        diag.warn(`You have already applied for this job. userId: ${user._id}, jobId: ${jobId}`, {method: "POST", route: "/jobs/id/applications", status: 400});
        res.status(400).json({
          message: "You have already applied for this job",
        });
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
            jobApplicationPostErrorCounter.add(1);
            diag.warn(`Job not found for application. jobId: ${jobId}`, {method: "POST", route: "/jobs/id/applications", status: 404});
            res.status(404).json({
              message: "Job does not exist",
            });
            return;
          }
          diag.debug(`Job found for application. jobId: ${jobId}`, {method: "POST", route: "/jobs/id/applications", status: 200});

          Application.countDocuments({
            jobId: jobId,
            status: {
              $nin: ["rejected", "deleted", "cancelled", "finished"],
            },
          })
            .then((activeApplicationCount) => {
              diag.debug(`Active application count: ${activeApplicationCount}`, {method: "POST", route: "/jobs/id/applications", status: 200});
              if (activeApplicationCount < job.maxApplicants) {
                Application.countDocuments({
                  userId: user._id,
                  status: {
                    $nin: ["rejected", "deleted", "cancelled", "finished"],
                  },
                })
                  .then((myActiveApplicationCount) => {
                    diag.debug(`User active application count: ${myActiveApplicationCount}`, {method: "POST", route: "/jobs/id/applications"});
                    if (myActiveApplicationCount < 10) {
                      Application.countDocuments({
                        userId: user._id,
                        status: "accepted",
                      }).then((acceptedJobs) => {
                        diag.debug(`User accepted jobs count: ${acceptedJobs}`, {method: "POST", route: "/jobs/id/applications"});
                        if (acceptedJobs === 0) {
                          const application = new Application({
                            userId: user._id,
                            recruiterId: job.userId,
                            jobId: job._id,
                            status: "applied",
                            sop: data.sop,
                          });
                          application
                            .save()
                            .then(() => {
                              diag.debug(`Job application successful. applicationId: ${application._id}`, {method: "POST", route: "/jobs/id/applications", status: 200});
                              res.json({
                                message: "Job application successful",
                              });
                            })
                            .catch((err) => {
                              jobApplicationPostErrorCounter.add(1);
                              diag.error(`Error saving job application: ${err}`, {method: "POST", route: "/jobs/id/applications", status: 400});
                              res.status(400).json(err);
                            });
                        } else {
                          jobApplicationPostErrorCounter.add(1);
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                        }
                      });
                    } else {
                      jobApplicationPostErrorCounter.add(1);
                      diag.warn(`You have 10 active applications. Hence you cannot apply. userId: ${user._id}, jobId: ${jobId}`, {method: "POST", route: "/jobs/id/applications", status: 400});
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                    }
                  })
                  .catch((err) => {
                    jobApplicationPostErrorCounter.add(1);
                    diag.error(`Error counting user active applications: ${err}`, {method: "POST", route: "/jobs/id/applications", status: 400});
                    res.status(400).json(err);
                  });
              } else {
                jobApplicationPostErrorCounter.add(1);
                diag.warn(`Application limit reached. userId: ${user._id}, jobId: ${jobId}`, {method: "POST", route: "/jobs/id/applications", status: 400});
                res.status(400).json({
                  message: "Application limit reached",
                });
              }
            })
            .catch((err) => {
              jobApplicationPostErrorCounter.add(1);
              diag.error(`Error counting active applications for job: ${err}`, {method: "POST", route: "/jobs/id/applications", status: 400});
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          jobApplicationPostErrorCounter.add(1);
          diag.error(`Error finding job for application: ${err}`, {method: "POST", route: "/jobs/id/applications", status: 400});
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      jobApplicationPostErrorCounter.add(1);
      diag.error(`Error checking previous application: ${err}`, {method: "POST", route: "/jobs/id/applications", status: 400});
      res.json(400).json(err);
    });
});

router.get("/jobs/:id/applications", jwtAuth, (req, res) => {
  jobApplicationsGetCounter.add(1);
  const user = req.user;
  diag.debug(`Recruiter fetching applications for job. userId: ${user._id}, jobId: ${req.params.id}`, {method: "GET", route: "/jobs/id/applications"});

  if (user.type != "recruiter") {
    jobApplicationsGetErrorCounter.add(1);
    diag.warn(`You don't have permissions to view job applications. userId: ${user._id}, jobId: ${req.params.id}`, {method: "GET", route: "/jobs/id/applications", status: 401});
    res.status(401).json({
      message: "You don't have permissions to view job applications",
    });
    return;
  }
  const jobId = req.params.id;

  let findParams = {
    jobId: jobId,
    recruiterId: user._id,
  };

  let sortParams = {};

  if (req.query.status) {
    findParams = {
      ...findParams,
      status: req.query.status,
    };
  }

  diag.debug(`Find parameters for applications: ${findParams}`, {method: "GET", route: "/jobs/id/applications"});

  Application.find(findParams)
    .collation({ locale: "en" })
    .sort(sortParams)
    .then((applications) => {
      if (applications.length === 0) {
        jobApplicationsGetErrorCounter.add(1);
        diag.warn(`No applications found for job. jobId: ${jobId}`, {method: "GET", route: "/jobs/id/applications", status: 404});
        res.status(404).json({
          message: "No applications found",
        });
        return;
      }
      diag.debug(`Applications found: ${applications.length}`, {method: "GET", route: "/jobs/id/applications", status: 200});
      res.json(applications);
    })
    .catch((err) => {
      jobApplicationsGetErrorCounter.add(1);
      diag.error(`Error fetching applications: ${err}`, {method: "GET", route: "/jobs/id/applications", status: 400});
      res.status(400).json(err);
    });
});

router.get("/applications", jwtAuth, (req, res) => {
  applicationsGetCounter.add(1);
  const user = req.user;
  diag.debug(`Fetching all applications for user. userId: ${user._id}`, {method: "GET", route: "/applications"});

  Application.aggregate([
    {
      $lookup: {
        from: "jobapplicantinfos",
        localField: "userId",
        foreignField: "userId",
        as: "jobApplicant",
      },
    },
    { $unwind: "$jobApplicant" },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    { $unwind: "$job" },
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "recruiterId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    {
      $match: {
        [user.type === "recruiter" ? "recruiterId" : "userId"]: user._id,
      },
    },
    {
      $sort: {
        dateOfApplication: -1,
      },
    },
  ])
    .then((applications) => {
      if (applications.length === 0) {
        applicationsGetErrorCounter.add(1);
        diag.warn(`No applications found for user. userId: ${user._id}`, {method: "GET", route: "/applications", status: 404});
        res.status(404).json({
          message: "No applications found",
        });
        return;
      }
      diag.debug(`Applications found for user. userId: ${user._id}`, {method: "GET", route: "/applications", status: 200});
      res.json(applications);
    })
    .catch((err) => {
      applicationsGetErrorCounter.add(1);
      diag.error(`Error fetching applications for user: ${err}`, {method: "GET", route: "/applications", status: 400});
      res.status(400).json(err);
    });
});

router.put("/applications/:id", jwtAuth, (req, res) => {
  applicationUpdateCounter.add(1);
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;
  diag.debug(`User attempting to update application status. userId: ${user._id}, applicationId: ${id}, status: ${status}`, {method: "PUT", route: "/applications/id"});

  if (user.type === "recruiter") {
    if (status === "accepted") {
      Application.findOne({
        _id: id,
        recruiterId: user._id,
      })
        .then((application) => {
          if (application === null) {
            applicationUpdateErrorCounter.add(1);
            diag.warn(`Application not found for acceptance. applicationId: ${id}`, {method: "PUT", route: "/applications/id", status: 404});
            res.status(404).json({
              message: "Application not found",
            });
            return;
          }

          Job.findOne({
            _id: application.jobId,
            userId: user._id,
          }).then((job) => {
            if (job === null) {
              applicationUpdateErrorCounter.add(1);
              diag.warn(`Job not found for application acceptance. jobId: ${application.jobId}`, {method: "PUT", route: "/applications/id", status: 404});
              res.status(404).json({
                message: "Job does not exist",
              });
              return;
            }

            Application.countDocuments({
              recruiterId: user._id,
              jobId: job._id,
              status: "accepted",
            }).then((activeApplicationCount) => {
              diag.debug('Active accepted applications count:', activeApplicationCount);
              if (activeApplicationCount < job.maxPositions) {
                application.status = status;
                application.dateOfJoining = req.body.dateOfJoining;
                application
                  .save()
                  .then(() => {
                    Application.updateMany(
                      {
                        _id: {
                          $ne: application._id,
                        },
                        userId: application.userId,
                        status: {
                          $nin: [
                            "rejected",
                            "deleted",
                            "cancelled",
                            "accepted",
                            "finished",
                          ],
                        },
                      },
                      {
                        $set: {
                          status: "cancelled",
                        },
                      },
                      { multi: true }
                    )
                      .then(() => {
                        if (status === "accepted") {
                          Job.findOneAndUpdate(
                            {
                              _id: job._id,
                              userId: user._id,
                            },
                            {
                              $set: {
                                acceptedCandidates: activeApplicationCount + 1,
                              },
                            }
                          )
                            .then(() => {
                              diag.debug(`Application accepted successfully. applicationId: ${application._id}`, {method: "PUT", route: "/applications/id", status: 200});
                              res.json({
                                message: `Application ${status} successfully`,
                              });
                            })
                            .catch((err) => {
                              applicationUpdateErrorCounter.add(1);
                              diag.error(`Error updating job after acceptance: ${err}`, {method: "PUT", route: "/applications/id", status: 400});
                              res.status(400).json(err);
                            });
                        } else {
                          diag.debug(`Application accepted successfully. applicationId: ${application._id}`, {method: "PUT", route: "/applications/id", status: 200});
                          res.json({
                            message: `Application ${status} successfully`,
                          });
                        }
                      })
                      .catch((err) => {
                        applicationUpdateErrorCounter.add(1);
                        diag.error(`Error updating other applications after acceptance: ${err}`, {method: "PUT", route: "/applications/id", status: 400});
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    applicationUpdateErrorCounter.add(1);
                    diag.error(`Error saving application after acceptance: ${err}`, {method: "PUT", route: "/applications/id", status: 400});
                    res.status(400).json(err);
                  });
              } else {
                applicationUpdateErrorCounter.add(1);
                diag.warn(`All positions for this job are already filled. applicationId: ${id}`, {method: "PUT", route: "/applications/id", status: 400});
                res.status(400).json({
                  message: "All positions for this job are already filled",
                });
              }
            });
          });
        })
        .catch((err) => {
          applicationUpdateErrorCounter.add(1);
          diag.error(`Error finding application for acceptance: ${err}`, {method: "PUT", route: "/applications/id", status: 400});
          res.status(400).json(err);
        });
    } else {
      Application.findOneAndUpdate(
        {
          _id: id,
          recruiterId: user._id,
          status: {
            $nin: ["rejected", "deleted", "cancelled"],
          },
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((application) => {
          if (application === null) {
            applicationUpdateErrorCounter.add(1);
            diag.warn(`Application status cannot be updated. applicationId: ${id}`, {method: "PUT", route: "/applications/id", status: 400});
            res.status(400).json({
              message: "Application status cannot be updated",
            });
            return;
          }
          diag.debug(`Application status updated successfully. applicationId: ${id}, status: ${status}`, {method: "PUT", route: "/applications/id", status: 200});
          if (status === "finished") {
            res.json({
              message: `Job ${status} successfully`,
            });
          } else {
            res.json({
              message: `Application ${status} successfully`,
            });
          }
        })
        .catch((err) => {
          applicationUpdateErrorCounter.add(1);
          diag.error(`Error updating application status: ${err}`, {method: "PUT", route: "/applications/id", status: 400});
          res.status(400).json(err);
        });
    }
  } else {
    if (status === "cancelled") {
      diag.debug(`Applicant attempting to cancel application. applicationId: ${id}, userId: ${user._id}`, {method: "PUT", route: "/applications/id"});
      Application.findOneAndUpdate(
        {
          _id: id,
          userId: user._id,
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((tmp) => {
          diag.debug(`Application cancelled successfully. applicationId: ${id}`, {method: "PUT", route: "/applications/id", status: 200});
          res.json({
            message: `Application ${status} successfully`,
          });
        })
        .catch((err) => {
          applicationUpdateErrorCounter.add(1);
          diag.error(`Error cancelling application: ${err}`, {method: "PUT", route: "/applications/id", status: 400});
          res.status(400).json(err);
        });
    } else {
      applicationUpdateErrorCounter.add(1);
      diag.warn(`You don't have permissions to update job status. applicationId: ${id}`, {method: "PUT", route: "/applications/id", status: 401});
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
});

router.get("/applicants", jwtAuth, (req, res) => {
  applicantsGetCounter.add(1);
  const user = req.user;
  diag.debug(`Recruiter fetching applicants. userId: ${user._id}`, {method: "GET", route: "/applicants"});

  if (user.type === "recruiter") {
    let findParams = {
      recruiterId: user._id,
    };
    if (req.query.jobId) {
      findParams = {
        ...findParams,
        jobId: new mongoose.Types.ObjectId(req.query.jobId),
      };
    }
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        findParams = {
          ...findParams,
          status: { $in: req.query.status },
        };
      } else {
        findParams = {
          ...findParams,
          status: req.query.status,
        };
      }
    }
    let sortParams = {};

    if (!req.query.asc && !req.query.desc) {
      sortParams = { _id: 1 };
    }

    if (req.query.asc) {
      if (Array.isArray(req.query.asc)) {
        req.query.asc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: 1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.asc]: 1,
        };
      }
    }

    if (req.query.desc) {
      if (Array.isArray(req.query.desc)) {
        req.query.desc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: -1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.desc]: -1,
        };
      }
    }

    diag.debug(`Find parameters for applicants. findParams: ${findParams}`, {method: "GET", route: "/applicants"});
    diag.debug(`Sort parameters for applicants. sortParams: ${sortParams}`, {method: "GET", route: "/applicants"});

    Application.aggregate([
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "userId",
          foreignField: "userId",
          as: "jobApplicant",
        },
      },
      { $unwind: "$jobApplicant" },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      { $match: findParams },
      { $sort: sortParams },
    ])
      .then((applications) => {
        if (applications.length === 0) {
          applicantsGetErrorCounter.add(1);
          diag.warn(`No applicants found for recruiter. userId: ${user._id}`, {method: "GET", route: "/applicants", status: 404});
          res.status(404).json({
            message: "No applicants found",
          });
          return;
        }
        diag.debug(`Applicants found for recruiter. userId: ${user._id}`, {method: "GET", route: "/applicants", status: 200});
        res.json(applications);
      })
      .catch((err) => {
        applicantsGetErrorCounter.add(1);
        diag.error(`Error fetching applicants for recruiter. userId: ${user._id}`, {method: "GET", route: "/applicants", status: 400});
        res.status(400).json(err);
      });
  } else {
    applicantsGetErrorCounter.add(1);
    diag.warn(`You are not allowed to access applicants list. userId: ${user._id}`, {method: "GET", route: "/applicants", status: 401});
    res.status(401).json({
      message: "You are not allowed to access applicants list",
    });
  }
});

router.put("/rating", jwtAuth, (req, res) => {
  ratingUpdateCounter.add(1);
  const user = req.user;
  const data = req.body;
  diag.debug(`User attempting to add/update rating. userId: ${user._id}`, {method: "PUT", route: "/rating"});

  if (user.type === "recruiter") {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.applicantId,
      category: "applicant",
    })
      .then((rating) => {
        if (rating === null) {
          diag.debug(`No existing rating found, creating new rating. userId: ${user._id}`, {method: "PUT", route: "/rating"});
          Application.countDocuments({
            userId: data.applicantId,
            recruiterId: user._id,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              diag.debug(`Accepted applicant count. userId: ${user._id}`, {method: "PUT", route: "/rating"});
              if (acceptedApplicant > 0) {
                rating = new Rating({
                  category: "applicant",
                  receiverId: data.applicantId,
                  senderId: user._id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.applicantId),
                          category: "applicant",
                        },
                      },
                      {
                        $group: {
                          _id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        if (result === null) {
                          ratingUpdateErrorCounter.add(1);
                          diag.error(`Error while calculating rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug(`Calculated average rating for applicant. userId: ${user._id}`, {method: "PUT", route: "/rating"});

                        JobApplicant.findOneAndUpdate(
                          {
                            userId: data.applicantId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((applicant) => {
                            if (applicant === null) {
                              ratingUpdateErrorCounter.add(1);
                              diag.error(`Error while updating applicant's average rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                              res.status(400).json({
                                message:
                                  "Error while updating applicant's average rating",
                              });
                              return;
                            }
                            diag.debug(`Applicant rating updated successfully. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 200});
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            ratingUpdateErrorCounter.add(1);
                            diag.error(`Error updating applicant rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        ratingUpdateErrorCounter.add(1);
                        diag.error(`Error calculating average rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                        res.status(400).json(err);
                      });
                    diag.debug(`Rating saved successfully. userId: ${user._id}`, {method: "PUT", route: "/rating"});
                  })
                  .catch((err) => {
                    ratingUpdateErrorCounter.add(1);
                    diag.error(`Error saving new rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                    res.status(400).json(err);
                  });
              } else {
                ratingUpdateErrorCounter.add(1);
                diag.error(`Applicant didn't worked under you. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                res.status(400).json({
                  message:
                    "Applicant didn't worked under you. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              ratingUpdateErrorCounter.add(1);
              diag.error(`Error counting accepted applicants. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
              res.status(400).json(err);
            });
        } else {
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.applicantId),
                    category: "applicant",
                  },
                },
                {
                  $group: {
                    _id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  if (result === null) {
                    ratingUpdateErrorCounter.add(1);
                    diag.error(`Error while calculating rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug(`Calculated average rating for applicant. userId: ${user._id}`, {method: "PUT", route: "/rating"});

                  JobApplicant.findOneAndUpdate(
                    {
                      userId: data.applicantId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((applicant) => {
                      if (applicant === null) {
                        ratingUpdateErrorCounter.add(1);
                        res.status(400).json({
                          message:
                            "Error while updating applicant's average rating",
                        });
                        return;
                      }
                      diag.debug(`Applicant rating updated successfully. userId: ${user._id}`, {method: "PUT", route: "/rating"});
                      res.json({
                        message: "Rating updated successfully",
                      });
                    })
                    .catch((err) => {
                      ratingUpdateErrorCounter.add(1);
                      diag.error(`Error updating applicant rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  ratingUpdateErrorCounter.add(1);
                  diag.error(`Error calculating average rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              ratingUpdateErrorCounter.add(1);
              diag.error(`Error saving updated rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        ratingUpdateErrorCounter.add(1);
        diag.error(`Error finding existing rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
        res.status(400).json(err);
      });
  } else {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.jobId,
      category: "job",
    })
      .then((rating) => {
        diag.debug(`Existing rating found. userId: ${user._id}`, {method: "PUT", route: "/rating"});
        if (rating === null) {
          Application.countDocuments({
            userId: user._id,
            jobId: data.jobId,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              diag.debug(`Accepted applicant count for job. userId: ${user._id}`, {method: "PUT", route: "/rating"});
              if (acceptedApplicant > 0) {
                rating = new Rating({
                  category: "job",
                  receiverId: data.jobId,
                  senderId: user._id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.jobId),
                          category: "job",
                        },
                      },
                      {
                        $group: {
                          _id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        if (result === null) {
                          ratingUpdateErrorCounter.add(1);
                          diag.error(`Error while calculating rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug(`Calculated average rating for job. userId: ${user._id}`, {method: "PUT", route: "/rating"});

                        Job.findOneAndUpdate(
                          {
                            _id: data.jobId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((foundJob) => {
                            if (foundJob === null) {
                              ratingUpdateErrorCounter.add(1);
                              diag.error(`Error while updating job's average rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                              res.status(400).json({
                                message:
                                  "Error while updating job's average rating",
                              });
                              return;
                            }
                            diag.debug(`Job rating updated successfully. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 200});
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            ratingUpdateErrorCounter.add(1);
                            diag.error(`Error updating job rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        ratingUpdateErrorCounter.add(1);
                        diag.error(`Error calculating average rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    ratingUpdateErrorCounter.add(1);
                    diag.error(`Error saving new rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                    res.status(400).json(err);
                  });
              } else {
                ratingUpdateErrorCounter.add(1);
                res.status(400).json({
                  message:
                    "You haven't worked for this job. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              ratingUpdateErrorCounter.add(1);
              diag.error(`Error counting accepted applicants for job. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
              res.status(400).json(err);
            });
        } else {
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.jobId),
                    category: "job",
                  },
                },
                {
                  $group: {
                    _id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  if (result === null) {
                    ratingUpdateErrorCounter.add(1);
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug(`Calculated average rating for job. userId: ${user._id}`, {method: "PUT", route: "/rating"});

                  Job.findOneAndUpdate(
                    {
                      _id: data.jobId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((foundJob) => {
                      if (foundJob === null) {
                        ratingUpdateErrorCounter.add(1);
                        res.status(400).json({
                          message: "Error while updating job's average rating",
                        });
                        return;
                      }
                      diag.debug(`Job rating updated successfully. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 200});
                      res.json({
                        message: "Rating added successfully",
                      });
                    })
                    .catch((err) => {
                      ratingUpdateErrorCounter.add(1);
                      diag.error(`Error updating job rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  ratingUpdateErrorCounter.add(1);
                  diag.error(`Error calculating average rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              ratingUpdateErrorCounter.add(1);
              diag.error(`Error saving updated rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        ratingUpdateErrorCounter.add(1);
        diag.error(`Error finding existing rating. userId: ${user._id}`, {method: "PUT", route: "/rating", status: 400});
        res.status(400).json(err);
      });
  }
});

router.get("/rating", jwtAuth, (req, res) => {
  ratingGetCounter.add(1);
  const user = req.user;
  diag.debug(`Fetching personal rating for user. userId: ${user._id}`, {method: "GET", route: "/rating"});

  Rating.findOne({
    senderId: user._id,
    receiverId: req.query.id,
    category: user.type === "recruiter" ? "applicant" : "job",
  }).then((rating) => {
    if (rating === null) {
      diag.debug(`No personal rating found. userId: ${user._id}`, {method: "GET", route: "/rating", status: 200});
      res.json({
        rating: -1,
      });
      return;
    }
    diag.debug(`Personal rating found. userId: ${user._id}`, {method: "GET", route: "/rating", status: 200});
    res.json({
      rating: rating.rating,
    });
  }).catch((err) => {
    ratingGetErrorCounter.add(1);
    diag.error(`Error fetching personal rating. userId: ${user._id}`, {method: "GET", route: "/rating", status: 400});
    res.status(400).json(err);
  });
});

module.exports = router;

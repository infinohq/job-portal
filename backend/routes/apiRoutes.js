const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const { diag } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');

const meterProvider = new MeterProvider();
const meter = meterProvider.getMeter('default');

const requestCounter = meter.createCounter('request_counter', {
  description: 'Counts the number of requests received',
});

const errorCounter = meter.createCounter('error_counter', {
  description: 'Counts the number of errors encountered',
});

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");

const router = express.Router();

router.post("/jobs", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/jobs', method: 'POST' });
  const user = req.user;
  diag.debug('User attempting to add job', { userId: user._id, userType: user.type });

  if (user.type != "recruiter") {
    errorCounter.add(1, { route: '/jobs', method: 'POST', error: 'Unauthorized' });
    diag.warn('Unauthorized job addition attempt', { userId: user._id });
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }

  const data = req.body;
  diag.debug('Job data received', { data });

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
      diag.info('Job added successfully', { jobId: job._id });
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/jobs', method: 'POST', error: 'Database Error' });
      diag.error('Error adding job', { error: err });
      res.status(400).json(err);
    });
});

router.get("/jobs", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/jobs', method: 'GET' });
  let user = req.user;
  diag.debug('Fetching jobs', { userId: user._id, userType: user.type });

  let findParams = {};
  let sortParams = {};

  if (user.type === "recruiter" && req.query.myjobs) {
    findParams = {
      ...findParams,
      userId: user._id,
    };
    diag.debug('Fetching jobs for recruiter', { userId: user._id });
  }

  if (req.query.q) {
    findParams = {
      ...findParams,
      title: {
        $regex: new RegExp(req.query.q, "i"),
      },
    };
    diag.debug('Job search query', { query: req.query.q });
  }

  if (req.query.jobType) {
    let jobTypes = [];
    if (Array.isArray(req.query.jobType)) {
      jobTypes = req.query.jobType;
    } else {
      jobTypes = [req.query.jobType];
    }
    diag.debug('Job types filter', { jobTypes });
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
    diag.debug('Salary range filter', { salaryMin: req.query.salaryMin, salaryMax: req.query.salaryMax });
  } else if (req.query.salaryMin) {
    findParams = {
      ...findParams,
      salary: {
        $gte: parseInt(req.query.salaryMin),
      },
    };
    diag.debug('Minimum salary filter', { salaryMin: req.query.salaryMin });
  } else if (req.query.salaryMax) {
    findParams = {
      ...findParams,
      salary: {
        $lte: parseInt(req.query.salaryMax),
      },
    };
    diag.debug('Maximum salary filter', { salaryMax: req.query.salaryMax });
  }

  if (req.query.duration) {
    findParams = {
      ...findParams,
      duration: {
        $lt: parseInt(req.query.duration),
      },
    };
    diag.debug('Duration filter', { duration: req.query.duration });
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
    diag.debug('Ascending sort parameters', { sortParams });
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
    diag.debug('Descending sort parameters', { sortParams });
  }

  diag.debug('Find parameters', { findParams });
  diag.debug('Sort parameters', { sortParams });

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

  diag.debug('Aggregation pipeline', { pipeline: arr });

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        errorCounter.add(1, { route: '/jobs', method: 'GET', error: 'No Jobs Found' });
        diag.warn('No jobs found');
        res.status(404).json({
          message: "No job found",
        });
        return;
      }
      diag.info('Jobs fetched successfully', { jobCount: posts.length });
      res.json(posts);
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/jobs', method: 'GET', error: 'Database Error' });
      diag.error('Error fetching jobs', { error: err });
      res.status(400).json(err);
    });
});

router.get("/jobs/:id", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/jobs/:id', method: 'GET' });
  diag.debug('Fetching job details', { jobId: req.params.id });
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        errorCounter.add(1, { route: '/jobs/:id', method: 'GET', error: 'Job Not Found' });
        diag.warn('Job not found', { jobId: req.params.id });
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      diag.info('Job details fetched', { jobId: req.params.id });
      res.json(job);
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/jobs/:id', method: 'GET', error: 'Database Error' });
      diag.error('Error fetching job details', { error: err });
      res.status(400).json(err);
    });
});

router.put("/jobs/:id", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/jobs/:id', method: 'PUT' });
  const user = req.user;
  diag.debug('User attempting to update job', { userId: user._id, userType: user.type, jobId: req.params.id });

  if (user.type != "recruiter") {
    errorCounter.add(1, { route: '/jobs/:id', method: 'PUT', error: 'Unauthorized' });
    diag.warn('Unauthorized job update attempt', { userId: user._id });
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
        errorCounter.add(1, { route: '/jobs/:id', method: 'PUT', error: 'Job Not Found' });
        diag.warn('Job not found for update', { jobId: req.params.id });
        res.status(404).json({
          message: "Job does not exist",
        });
        return;
      }
      const data = req.body;
      diag.debug('Job update data', { data });

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
          diag.info('Job details updated successfully', { jobId: req.params.id });
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          errorCounter.add(1, { route: '/jobs/:id', method: 'PUT', error: 'Database Error' });
          diag.error('Error updating job details', { error: err });
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/jobs/:id', method: 'PUT', error: 'Database Error' });
      diag.error('Error finding job for update', { error: err });
      res.status(400).json(err);
    });
});

router.delete("/jobs/:id", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/jobs/:id', method: 'DELETE' });
  const user = req.user;
  diag.debug('User attempting to delete job', { userId: user._id, userType: user.type, jobId: req.params.id });

  if (user.type != "recruiter") {
    errorCounter.add(1, { route: '/jobs/:id', method: 'DELETE', error: 'Unauthorized' });
    diag.warn('Unauthorized job deletion attempt', { userId: user._id });
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
        errorCounter.add(1, { route: '/jobs/:id', method: 'DELETE', error: 'Job Not Found' });
        diag.warn('Job not found for deletion', { jobId: req.params.id });
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      diag.info('Job deleted successfully', { jobId: req.params.id });
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/jobs/:id', method: 'DELETE', error: 'Database Error' });
      diag.error('Error deleting job', { error: err });
      res.status(400).json(err);
    });
});

router.get("/user", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/user', method: 'GET' });
  const user = req.user;
  diag.debug('Fetching user details', { userId: user._id, userType: user.type });

  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          errorCounter.add(1, { route: '/user', method: 'GET', error: 'User Not Found' });
          diag.warn('Recruiter not found', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.info('Recruiter details fetched', { userId: user._id });
        res.json(recruiter);
      })
      .catch((err) => {
        errorCounter.add(1, { route: '/user', method: 'GET', error: 'Database Error' });
        diag.error('Error fetching recruiter details', { error: err });
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          errorCounter.add(1, { route: '/user', method: 'GET', error: 'User Not Found' });
          diag.warn('Job applicant not found', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.info('Job applicant details fetched', { userId: user._id });
        res.json(jobApplicant);
      })
      .catch((err) => {
        errorCounter.add(1, { route: '/user', method: 'GET', error: 'Database Error' });
        diag.error('Error fetching job applicant details', { error: err });
        res.status(400).json(err);
      });
  }
});

router.get("/user/:id", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/user/:id', method: 'GET' });
  diag.debug('Fetching user details by ID', { userId: req.params.id });
  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        errorCounter.add(1, { route: '/user/:id', method: 'GET', error: 'User Not Found' });
        diag.warn('User not found by ID', { userId: req.params.id });
        res.status(404).json({
          message: "User does not exist",
        });
        return;
      }

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              errorCounter.add(1, { route: '/user/:id', method: 'GET', error: 'Recruiter Not Found' });
              diag.warn('Recruiter not found by user ID', { userId: userData._id });
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.info('Recruiter details fetched by user ID', { userId: userData._id });
            res.json(recruiter);
          })
          .catch((err) => {
            errorCounter.add(1, { route: '/user/:id', method: 'GET', error: 'Database Error' });
            diag.error('Error fetching recruiter details by user ID', { error: err });
            res.status(400).json(err);
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              errorCounter.add(1, { route: '/user/:id', method: 'GET', error: 'Job Applicant Not Found' });
              diag.warn('Job applicant not found by user ID', { userId: userData._id });
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.info('Job applicant details fetched by user ID', { userId: userData._id });
            res.json(jobApplicant);
          })
          .catch((err) => {
            errorCounter.add(1, { route: '/user/:id', method: 'GET', error: 'Database Error' });
            diag.error('Error fetching job applicant details by user ID', { error: err });
            res.status(400).json(err);
          });
      }
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/user/:id', method: 'GET', error: 'Database Error' });
      diag.error('Error fetching user by ID', { error: err });
      res.status(400).json(err);
    });
});

router.put("/user", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/user', method: 'PUT' });
  const user = req.user;
  const data = req.body;
  diag.debug('User attempting to update personal details', { userId: user._id, userType: user.type });

  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          errorCounter.add(1, { route: '/user', method: 'PUT', error: 'Recruiter Not Found' });
          diag.warn('Recruiter not found for update', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug('Recruiter update data', { data });

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
            diag.info('Recruiter details updated successfully', { userId: user._id });
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            errorCounter.add(1, { route: '/user', method: 'PUT', error: 'Database Error' });
            diag.error('Error updating recruiter details', { error: err });
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        errorCounter.add(1, { route: '/user', method: 'PUT', error: 'Database Error' });
        diag.error('Error finding recruiter for update', { error: err });
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          errorCounter.add(1, { route: '/user', method: 'PUT', error: 'Job Applicant Not Found' });
          diag.warn('Job applicant not found for update', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug('Job applicant update data', { data });

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
        diag.debug('Job applicant details before save', { jobApplicant });

        jobApplicant
          .save()
          .then(() => {
            diag.info('Job applicant details updated successfully', { userId: user._id });
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            errorCounter.add(1, { route: '/user', method: 'PUT', error: 'Database Error' });
            diag.error('Error updating job applicant details', { error: err });
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        errorCounter.add(1, { route: '/user', method: 'PUT', error: 'Database Error' });
        diag.error('Error finding job applicant for update', { error: err });
        res.status(400).json(err);
      });
  }
});

router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/jobs/:id/applications', method: 'POST' });
  const user = req.user;
  diag.debug('User attempting to apply for job', { userId: user._id, userType: user.type, jobId: req.params.id });

  if (user.type != "applicant") {
    errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Unauthorized' });
    diag.warn('Unauthorized job application attempt', { userId: user._id });
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    return;
  }
  const data = req.body;
  const jobId = req.params.id;
  diag.debug('Job application data', { data });

  Application.findOne({
    userId: user._id,
    jobId: jobId,
    status: {
      $nin: ["deleted", "accepted", "cancelled"],
    },
  })
    .then((appliedApplication) => {
      diag.debug('Previous application check', { appliedApplication });
      if (appliedApplication !== null) {
        errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Already Applied' });
        diag.warn('User already applied for job', { userId: user._id, jobId });
        res.status(400).json({
          message: "You have already applied for this job",
        });
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
            errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Job Not Found' });
            diag.warn('Job not found for application', { jobId });
            res.status(404).json({
              message: "Job does not exist",
            });
            return;
          }
          Application.countDocuments({
            jobId: jobId,
            status: {
              $nin: ["rejected", "deleted", "cancelled", "finished"],
            },
          })
            .then((activeApplicationCount) => {
              diag.debug('Active application count', { activeApplicationCount });
              if (activeApplicationCount < job.maxApplicants) {
                Application.countDocuments({
                  userId: user._id,
                  status: {
                    $nin: ["rejected", "deleted", "cancelled", "finished"],
                  },
                })
                  .then((myActiveApplicationCount) => {
                    diag.debug('User active application count', { myActiveApplicationCount });
                    if (myActiveApplicationCount < 10) {
                      Application.countDocuments({
                        userId: user._id,
                        status: "accepted",
                      }).then((acceptedJobs) => {
                        diag.debug('User accepted jobs count', { acceptedJobs });
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
                              diag.info('Job application successful', { applicationId: application._id });
                              res.json({
                                message: "Job application successful",
                              });
                            })
                            .catch((err) => {
                              errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Database Error' });
                              diag.error('Error saving job application', { error: err });
                              res.status(400).json(err);
                            });
                        } else {
                          errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Already Accepted Job' });
                          diag.warn('User already has an accepted job', { userId: user._id });
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                        }
                      });
                    } else {
                      errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Max Active Applications' });
                      diag.warn('User has 10 active applications', { userId: user._id });
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                    }
                  })
                  .catch((err) => {
                    errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Database Error' });
                    diag.error('Error counting user active applications', { error: err });
                    res.status(400).json(err);
                  });
              } else {
                errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Application Limit Reached' });
                diag.warn('Application limit reached for job', { jobId });
                res.status(400).json({
                  message: "Application limit reached",
                });
              }
            })
            .catch((err) => {
              errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Database Error' });
              diag.error('Error counting active applications for job', { error: err });
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Database Error' });
          diag.error('Error finding job for application', { error: err });
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/jobs/:id/applications', method: 'POST', error: 'Database Error' });
      diag.error('Error checking previous application', { error: err });
      res.json(400).json(err);
    });
});

router.get("/jobs/:id/applications", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/jobs/:id/applications', method: 'GET' });
  const user = req.user;
  diag.debug('Recruiter fetching applications for job', { userId: user._id, jobId: req.params.id });

  if (user.type != "recruiter") {
    errorCounter.add(1, { route: '/jobs/:id/applications', method: 'GET', error: 'Unauthorized' });
    diag.warn('Unauthorized attempt to view job applications', { userId: user._id });
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
    diag.debug('Application status filter', { status: req.query.status });
  }

  Application.find(findParams)
    .collation({ locale: "en" })
    .sort(sortParams)
    .then((applications) => {
      diag.info('Applications fetched successfully', { applicationCount: applications.length });
      res.json(applications);
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/jobs/:id/applications', method: 'GET', error: 'Database Error' });
      diag.error('Error fetching applications', { error: err });
      res.status(400).json(err);
    });
});

router.get("/applications", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/applications', method: 'GET' });
  const user = req.user;
  diag.debug('Fetching all applications for user', { userId: user._id, userType: user.type });

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
      diag.info('Applications fetched successfully', { applicationCount: applications.length });
      res.json(applications);
    })
    .catch((err) => {
      errorCounter.add(1, { route: '/applications', method: 'GET', error: 'Database Error' });
      diag.error('Error fetching applications', { error: err });
      res.status(400).json(err);
    });
});

router.put("/applications/:id", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/applications/:id', method: 'PUT' });
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;
  diag.debug('Updating application status', { userId: user._id, applicationId: id, status });

  if (user.type === "recruiter") {
    if (status === "accepted") {
      Application.findOne({
        _id: id,
        recruiterId: user._id,
      })
        .then((application) => {
          if (application === null) {
            errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Application Not Found' });
            diag.warn('Application not found for acceptance', { applicationId: id });
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
              errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Job Not Found' });
              diag.warn('Job not found for application acceptance', { jobId: application.jobId });
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
              diag.debug('Active accepted application count', { activeApplicationCount });
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
                              diag.info('Application accepted successfully', { applicationId: id });
                              res.json({
                                message: `Application ${status} successfully`,
                              });
                            })
                            .catch((err) => {
                              errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Database Error' });
                              diag.error('Error updating job after acceptance', { error: err });
                              res.status(400).json(err);
                            });
                        } else {
                          diag.info('Application status updated successfully', { applicationId: id, status });
                          res.json({
                            message: `Application ${status} successfully`,
                          });
                        }
                      })
                      .catch((err) => {
                        errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Database Error' });
                        diag.error('Error updating other applications after acceptance', { error: err });
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Database Error' });
                    diag.error('Error saving application after acceptance', { error: err });
                    res.status(400).json(err);
                  });
              } else {
                errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Positions Filled' });
                diag.warn('All positions for job are filled', { jobId: job._id });
                res.status(400).json({
                  message: "All positions for this job are already filled",
                });
              }
            });
          });
        })
        .catch((err) => {
          errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Database Error' });
          diag.error('Error finding application for acceptance', { error: err });
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
            errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Application Not Found' });
            diag.warn('Application status cannot be updated', { applicationId: id });
            res.status(400).json({
              message: "Application status cannot be updated",
            });
            return;
          }
          diag.info('Application status updated successfully', { applicationId: id, status });
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
          errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Database Error' });
          diag.error('Error updating application status', { error: err });
          res.status(400).json(err);
        });
    }
  } else {
    if (status === "cancelled") {
      diag.debug('Applicant cancelling application', { applicationId: id, userId: user._id });
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
          diag.info('Application cancelled successfully', { applicationId: id });
          res.json({
            message: `Application ${status} successfully`,
          });
        })
        .catch((err) => {
          errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Database Error' });
          diag.error('Error cancelling application', { error: err });
          res.status(400).json(err);
        });
    } else {
      errorCounter.add(1, { route: '/applications/:id', method: 'PUT', error: 'Unauthorized' });
      diag.warn('Unauthorized attempt to update application status', { userId: user._id });
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
});

router.get("/applicants", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/applicants', method: 'GET' });
  const user = req.user;
  diag.debug('Fetching applicants for recruiter', { userId: user._id });

  if (user.type === "recruiter") {
    let findParams = {
      recruiterId: user._id,
    };
    if (req.query.jobId) {
      findParams = {
        ...findParams,
        jobId: new mongoose.Types.ObjectId(req.query.jobId),
      };
      diag.debug('Job ID filter for applicants', { jobId: req.query.jobId });
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
      diag.debug('Status filter for applicants', { status: req.query.status });
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
      diag.debug('Ascending sort parameters for applicants', { sortParams });
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
      diag.debug('Descending sort parameters for applicants', { sortParams });
    }

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
          errorCounter.add(1, { route: '/applicants', method: 'GET', error: 'No Applicants Found' });
          diag.warn('No applicants found', { userId: user._id });
          res.status(404).json({
            message: "No applicants found",
          });
          return;
        }
        diag.info('Applicants fetched successfully', { applicantCount: applications.length });
        res.json(applications);
      })
      .catch((err) => {
        errorCounter.add(1, { route: '/applicants', method: 'GET', error: 'Database Error' });
        diag.error('Error fetching applicants', { error: err });
        res.status(400).json(err);
      });
  } else {
    errorCounter.add(1, { route: '/applicants', method: 'GET', error: 'Unauthorized' });
    diag.warn('Unauthorized attempt to access applicants list', { userId: user._id });
    res.status(400).json({
      message: "You are not allowed to access applicants list",
    });
  }
});

router.put("/rating", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/rating', method: 'PUT' });
  const user = req.user;
  const data = req.body;
  diag.debug('User attempting to add/update rating', { userId: user._id, userType: user.type, data });

  if (user.type === "recruiter") {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.applicantId,
      category: "applicant",
    })
      .then((rating) => {
        if (rating === null) {
          diag.debug('New rating for applicant', { applicantId: data.applicantId });
          Application.countDocuments({
            userId: data.applicantId,
            recruiterId: user._id,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
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
                          errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Rating Calculation Error' });
                          diag.error('Error calculating average rating', { applicantId: data.applicantId });
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug('Average rating calculated', { applicantId: data.applicantId, average: avg });

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
                              errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Applicant Not Found' });
                              diag.error('Error updating applicant average rating', { applicantId: data.applicantId });
                              res.status(400).json({
                                message:
                                  "Error while updating applicant's average rating",
                              });
                              return;
                            }
                            diag.info('Rating added successfully', { applicantId: data.applicantId });
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                            diag.error('Error updating applicant rating', { error: err });
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                        diag.error('Error aggregating ratings', { error: err });
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                    diag.error('Error saving new rating', { error: err });
                    res.status(400).json(err);
                  });
              } else {
                errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Unauthorized Rating' });
                diag.warn('Recruiter cannot rate applicant', { applicantId: data.applicantId });
                res.status(400).json({
                  message:
                    "Applicant didn't worked under you. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
              diag.error('Error counting accepted applications for rating', { error: err });
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
                    errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Rating Calculation Error' });
                    diag.error('Error calculating average rating', { applicantId: data.applicantId });
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug('Average rating calculated', { applicantId: data.applicantId, average: avg });

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
                        errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Applicant Not Found' });
                        diag.error('Error updating applicant average rating', { applicantId: data.applicantId });
                        res.status(400).json({
                          message:
                            "Error while updating applicant's average rating",
                        });
                        return;
                      }
                      diag.info('Rating updated successfully', { applicantId: data.applicantId });
                      res.json({
                        message: "Rating updated successfully",
                      });
                    })
                    .catch((err) => {
                      errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                      diag.error('Error updating applicant rating', { error: err });
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                  diag.error('Error aggregating ratings', { error: err });
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
              diag.error('Error saving updated rating', { error: err });
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
        diag.error('Error finding rating for applicant', { error: err });
        res.status(400).json(err);
      });
  } else {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.jobId,
      category: "job",
    })
      .then((rating) => {
        diag.debug('Applicant rating job', { userId: user._id, jobId: data.jobId, rating });

        if (rating === null) {
          Application.countDocuments({
            userId: user._id,
            jobId: data.jobId,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
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
                          errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Rating Calculation Error' });
                          diag.error('Error calculating average rating', { jobId: data.jobId });
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug('Average rating calculated', { jobId: data.jobId, average: avg });

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
                              errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Job Not Found' });
                              diag.error('Error updating job average rating', { jobId: data.jobId });
                              res.status(400).json({
                                message:
                                  "Error while updating job's average rating",
                              });
                              return;
                            }
                            diag.info('Rating added successfully', { jobId: data.jobId });
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                            diag.error('Error updating job rating', { error: err });
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                        diag.error('Error aggregating ratings', { error: err });
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                    diag.error('Error saving new rating', { error: err });
                    res.status(400).json(err);
                  });
              } else {
                errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Unauthorized Rating' });
                diag.warn('Applicant cannot rate job', { jobId: data.jobId });
                res.status(400).json({
                  message:
                    "You haven't worked for this job. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
              diag.error('Error counting accepted applications for rating', { error: err });
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
                    errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Rating Calculation Error' });
                    diag.error('Error calculating average rating', { jobId: data.jobId });
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug('Average rating calculated', { jobId: data.jobId, average: avg });

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
                        errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Job Not Found' });
                        diag.error('Error updating job average rating', { jobId: data.jobId });
                        res.status(400).json({
                          message: "Error while updating job's average rating",
                        });
                        return;
                      }
                      diag.info('Rating updated successfully', { jobId: data.jobId });
                      res.json({
                        message: "Rating added successfully",
                      });
                    })
                    .catch((err) => {
                      errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                      diag.error('Error updating job rating', { error: err });
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
                  diag.error('Error aggregating ratings', { error: err });
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
              diag.error('Error saving updated rating', { error: err });
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        errorCounter.add(1, { route: '/rating', method: 'PUT', error: 'Database Error' });
        diag.error('Error finding rating for job', { error: err });
        res.status(400).json(err);
      });
  }
});

router.get("/rating", jwtAuth, (req, res) => {
  requestCounter.add(1, { route: '/rating', method: 'GET' });
  const user = req.user;
  diag.debug('Fetching personal rating', { userId: user._id, receiverId: req.query.id });

  Rating.findOne({
    senderId: user._id,
    receiverId: req.query.id,
    category: user.type === "recruiter" ? "applicant" : "job",
  }).then((rating) => {
    if (rating === null) {
      diag.info('No personal rating found', { userId: user._id, receiverId: req.query.id });
      res.json({
        rating: -1,
      });
      return;
    }
    diag.info('Personal rating fetched', { userId: user._id, receiverId: req.query.id, rating: rating.rating });
    res.json({
      rating: rating.rating,
    });
  });
});

module.exports = router;

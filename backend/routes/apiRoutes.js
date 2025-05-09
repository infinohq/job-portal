const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");

const router = express.Router();

// To add new job
router.post("/jobs", jwtAuth, (req, res) => {
  const user = req.user;
  diag.info('Received request to add new job', { user });

  if (user.type != "recruiter") {
    diag.warn('Unauthorized attempt to add job', { user });
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }

  const data = req.body;
  diag.info('Job data received', { data });

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
      diag.info('Job added successfully', { job });
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      diag.error('Error adding job', { err });
      res.status(400).json(err);
    });
});

// to get all the jobs [pagination] [for recruiter personal and for everyone]
router.get("/jobs", jwtAuth, (req, res) => {
  let user = req.user;
  diag.info('Received request to get jobs', { user });

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
    diag.info('Job types filter applied', { jobTypes });
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

  diag.info('Find and sort parameters', { findParams, sortParams });

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

  diag.info('Aggregation pipeline', { arr });

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        diag.warn('No jobs found', { findParams });
        res.status(404).json({
          message: "No job found",
        });
        return;
      }
      diag.info('Jobs retrieved successfully', { posts });
      res.json(posts);
    })
    .catch((err) => {
      diag.error('Error retrieving jobs', { err });
      res.status(400).json(err);
    });
});

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, (req, res) => {
  diag.info('Received request to get job info', { jobId: req.params.id });
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        diag.warn('Job not found', { jobId: req.params.id });
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      diag.info('Job retrieved successfully', { job });
      res.json(job);
    })
    .catch((err) => {
      diag.error('Error retrieving job', { err });
      res.status(400).json(err);
    });
});

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  diag.info('Received request to update job', { user, jobId: req.params.id });

  if (user.type != "recruiter") {
    diag.warn('Unauthorized attempt to update job', { user });
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
        diag.warn('Job not found for update', { jobId: req.params.id });
        res.status(404).json({
          message: "Job does not exist",
        });
        return;
      }
      const data = req.body;
      diag.info('Job data for update', { data });

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
          diag.info('Job updated successfully', { job });
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          diag.error('Error updating job', { err });
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      diag.error('Error finding job for update', { err });
      res.status(400).json(err);
    });
});

// to delete a job
router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  diag.info('Received request to delete job', { user, jobId: req.params.id });

  if (user.type != "recruiter") {
    diag.warn('Unauthorized attempt to delete job', { user });
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
        diag.warn('Job not found for deletion', { jobId: req.params.id });
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      diag.info('Job deleted successfully', { job });
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      diag.error('Error deleting job', { err });
      res.status(400).json(err);
    });
});

// get user's personal details
router.get("/user", jwtAuth, (req, res) => {
  const user = req.user;
  diag.info('Received request to get user details', { user });

  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          diag.warn('Recruiter not found', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.info('Recruiter details retrieved successfully', { recruiter });
        res.json(recruiter);
      })
      .catch((err) => {
        diag.error('Error retrieving recruiter details', { err });
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          diag.warn('Job applicant not found', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.info('Job applicant details retrieved successfully', { jobApplicant });
        res.json(jobApplicant);
      })
      .catch((err) => {
        diag.error('Error retrieving job applicant details', { err });
        res.status(400).json(err);
      });
  }
});

// get user details from id
router.get("/user/:id", jwtAuth, (req, res) => {
  diag.info('Received request to get user details by ID', { userId: req.params.id });

  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        diag.warn('User not found', { userId: req.params.id });
        res.status(404).json({
          message: "User does not exist",
        });
        return;
      }

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              diag.warn('Recruiter not found', { userId: userData._id });
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.info('Recruiter details retrieved successfully', { recruiter });
            res.json(recruiter);
          })
          .catch((err) => {
            diag.error('Error retrieving recruiter details', { err });
            res.status(400).json(err);
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              diag.warn('Job applicant not found', { userId: userData._id });
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.info('Job applicant details retrieved successfully', { jobApplicant });
            res.json(jobApplicant);
          })
          .catch((err) => {
            diag.error('Error retrieving job applicant details', { err });
            res.status(400).json(err);
          });
      }
    })
    .catch((err) => {
      diag.error('Error retrieving user details', { err });
      res.status(400).json(err);
    });
});

// update user details
router.put("/user", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  diag.info('Received request to update user details', { user, data });

  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          diag.warn('Recruiter not found for update', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
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
            diag.info('Recruiter details updated successfully', { recruiter });
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            diag.error('Error updating recruiter details', { err });
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        diag.error('Error finding recruiter for update', { err });
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          diag.warn('Job applicant not found for update', { userId: user._id });
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
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
        diag.info('Job applicant data for update', { jobApplicant });
        jobApplicant
          .save()
          .then(() => {
            diag.info('Job applicant details updated successfully', { jobApplicant });
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            diag.error('Error updating job applicant details', { err });
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        diag.error('Error finding job applicant for update', { err });
        res.status(400).json(err);
      });
  }
});

// apply for a job [todo: test: done]
router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  diag.info('Received request to apply for job', { user, jobId: req.params.id });

  if (user.type != "applicant") {
    diag.warn('Unauthorized attempt to apply for job', { user });
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    return;
  }
  const data = req.body;
  const jobId = req.params.id;

  Application.findOne({
    userId: user._id,
    jobId: jobId,
    status: {
      $nin: ["deleted", "accepted", "cancelled"],
    },
  })
    .then((appliedApplication) => {
      diag.info('Checked for previous applications', { appliedApplication });
      if (appliedApplication !== null) {
        diag.warn('User has already applied for this job', { user, jobId });
        res.status(400).json({
          message: "You have already applied for this job",
        });
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
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
              diag.info('Active application count', { activeApplicationCount });
              if (activeApplicationCount < job.maxApplicants) {
                Application.countDocuments({
                  userId: user._id,
                  status: {
                    $nin: ["rejected", "deleted", "cancelled", "finished"],
                  },
                })
                  .then((myActiveApplicationCount) => {
                    diag.info('User active application count', { myActiveApplicationCount });
                    if (myActiveApplicationCount < 10) {
                      Application.countDocuments({
                        userId: user._id,
                        status: "accepted",
                      }).then((acceptedJobs) => {
                        diag.info('User accepted jobs count', { acceptedJobs });
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
                              diag.info('Job application successful', { application });
                              res.json({
                                message: "Job application successful",
                              });
                            })
                            .catch((err) => {
                              diag.error('Error saving job application', { err });
                              res.status(400).json(err);
                            });
                        } else {
                          diag.warn('User already has an accepted job', { user });
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                        }
                      });
                    } else {
                      diag.warn('User has 10 active applications', { user });

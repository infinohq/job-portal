const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const { trace } = require("@opentelemetry/api");

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");

const router = express.Router();
const tracer = trace.getTracer("default");

// To add new job
router.post("/jobs", jwtAuth, (req, res) => {
  const span = tracer.startSpan("POST /jobs");
  const user = req.user;

  if (user.type != "recruiter") {
    span.addEvent("Unauthorized access attempt to add job");
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    span.end();
    return;
  }

  const data = req.body;

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
      span.addEvent("Job added successfully");
      res.json({ message: "Job added successfully to the database" });
      span.end();
    })
    .catch((err) => {
      span.recordException(err);
      res.status(400).json(err);
      span.end();
    });
});

// to get all the jobs [pagination] [for recruiter personal and for everyone]
router.get("/jobs", jwtAuth, (req, res) => {
  const span = tracer.startSpan("GET /jobs");
  let user = req.user;

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

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        span.addEvent("No job found");
        res.status(404).json({
          message: "No job found",
        });
        span.end();
        return;
      }
      span.addEvent("Jobs retrieved successfully");
      res.json(posts);
      span.end();
    })
    .catch((err) => {
      span.recordException(err);
      res.status(400).json(err);
      span.end();
    });
});

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, (req, res) => {
  const span = tracer.startSpan("GET /jobs/:id");
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        span.addEvent("Job does not exist");
        res.status(400).json({
          message: "Job does not exist",
        });
        span.end();
        return;
      }
      span.addEvent("Job retrieved successfully");
      res.json(job);
      span.end();
    })
    .catch((err) => {
      span.recordException(err);
      res.status(400).json(err);
      span.end();
    });
});

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, (req, res) => {
  const span = tracer.startSpan("PUT /jobs/:id");
  const user = req.user;
  if (user.type != "recruiter") {
    span.addEvent("Unauthorized access attempt to update job");
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    span.end();
    return;
  }
  Job.findOne({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job == null) {
        span.addEvent("Job does not exist");
        res.status(404).json({
          message: "Job does not exist",
        });
        span.end();
        return;
      }
      const data = req.body;
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
          span.addEvent("Job details updated successfully");
          res.json({
            message: "Job details updated successfully",
          });
          span.end();
        })
        .catch((err) => {
          span.recordException(err);
          res.status(400).json(err);
          span.end();
        });
    })
    .catch((err) => {
      span.recordException(err);
      res.status(400).json(err);
      span.end();
    });
});

// to delete a job
router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const span = tracer.startSpan("DELETE /jobs/:id");
  const user = req.user;
  if (user.type != "recruiter") {
    span.addEvent("Unauthorized access attempt to delete job");
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    span.end();
    return;
  }
  Job.findOneAndDelete({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job === null) {
        span.addEvent("Unauthorized access attempt to delete job");
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        span.end();
        return;
      }
      span.addEvent("Job deleted successfully");
      res.json({
        message: "Job deleted successfully",
      });
      span.end();
    })
    .catch((err) => {
      span.recordException(err);
      res.status(400).json(err);
      span.end();
    });
});

// get user's personal details
router.get("/user", jwtAuth, (req, res) => {
  const span = tracer.startSpan("GET /user");
  const user = req.user;
  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          span.addEvent("User does not exist");
          res.status(404).json({
            message: "User does not exist",
          });
          span.end();
          return;
        }
        span.addEvent("Recruiter details retrieved successfully");
        res.json(recruiter);
        span.end();
      })
      .catch((err) => {
        span.recordException(err);
        res.status(400).json(err);
        span.end();
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          span.addEvent("User does not exist");
          res.status(404).json({
            message: "User does not exist",
          });
          span.end();
          return;
        }
        span.addEvent("Job applicant details retrieved successfully");
        res.json(jobApplicant);
        span.end();
      })
      .catch((err) => {
        span.recordException(err);
        res.status(400).json(err);
        span.end();
      });
  }
});

// get user details from id
router.get("/user/:id", jwtAuth, (req, res) => {
  const span = tracer.startSpan("GET /user/:id");
  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        span.addEvent("User does not exist");
        res.status(404).json({
          message: "User does not exist",
        });
        span.end();
        return;
      }

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              span.addEvent("User does not exist");
              res.status(404).json({
                message: "User does not exist",
              });
              span.end();
              return;
            }
            span.addEvent("Recruiter details retrieved successfully");
            res.json(recruiter);
            span.end();
          })
          .catch((err) => {
            span.recordException(err);
            res.status(400).json(err);
            span.end();
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              span.addEvent("User does not exist");
              res.status(404).json({
                message: "User does not exist",
              });
              span.end();
              return;
            }
            span.addEvent("Job applicant details retrieved successfully");
            res.json(jobApplicant);
            span.end();
          })
          .catch((err) => {
            span.recordException(err);
            res.status(400).json(err);
            span.end();
          });
      }
    })
    .catch((err) => {
      span.recordException(err);
      res.status(400).json(err);
      span.end();
    });
});

// update user details
router.put("/user", jwtAuth, (req, res) => {
  const span = tracer.startSpan("PUT /user");
  const user = req.user;
  const data = req.body;
  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          span.addEvent("User does not exist");
          res.status(404).json({
            message: "User does not exist",
          });
          span.end();
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
            span.addEvent("User information updated successfully");
            res.json({
              message: "User information updated successfully",
            });
            span.end();
          })
          .catch((err) => {
            span.recordException(err);
            res.status(400).json(err);
            span.end();
          });
      })
      .catch((err) => {
        span.recordException(err);
        res.status(400).json(err);
        span.end();
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          span.addEvent("User does not exist");
          res.status(404).json({
            message: "User does not exist",
          });
          span.end();
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
        jobApplicant
          .save()
          .then(() => {
            span.addEvent("User information updated successfully");
            res.json({
              message: "User information updated successfully",
            });
            span.end();
          })
          .catch((err) => {
            span.recordException(err);
            res.status(400).json(err);
            span.end();
          });
      })
      .catch((err) => {
        span.recordException(err);
        res.status(400).json(err);
        span.end();
      });
  }
});

// apply for a job [todo: test: done]
router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  const span = tracer.startSpan("POST /jobs/:id/applications");
  const user = req.user;
  if (user.type != "applicant") {
    span.addEvent("Unauthorized access attempt to apply for job");
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    span.end();
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
      if (appliedApplication !== null) {
        span.addEvent("Already applied for this job");
        res.status(400).json({
          message: "You have already applied for this job",
        });
        span.end();
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
            span.addEvent("Job does not exist");
            res.status(404).json({
              message: "Job does not exist",
            });
            span.end();
            return;
          }
          Application.countDocuments({
            jobId: jobId,
            status: {
              $nin: ["rejected", "deleted", "cancelled", "finished"],
            },
          })
            .then((activeApplicationCount) => {
              if (activeApplicationCount < job.maxApplicants) {
                Application.countDocuments({
                  userId: user._id,
                  status: {
                    $nin: ["rejected", "deleted", "cancelled", "finished"],
                  },
                })
                  .then((myActiveApplicationCount) => {
                    if (myActiveApplicationCount < 10) {
                      Application.countDocuments({
                        userId: user._id,
                        status: "accepted",
                      }).then((acceptedJobs) => {
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
                              span.addEvent("Job application successful");
                              res.json({
                                message: "Job application successful",
                              });
                              span.end();
                            })
                            .catch((err) => {
                              span.recordException(err);
                              res.status(400).json(err);
                              span.end();
                            });
                        } else {
                          span.addEvent("Already have an accepted job");
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                          span.end();
                        }
                      });
                    } else {
                      span.addEvent("Active application limit reached");
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                      span.end();
                    }
                  })
                  .catch((err) => {
                    span.recordException(err);
                    res.status(400).json(err);
                    span.end();
                  });
              } else {
                span.addEvent("Application limit reached");
                res.status(400).json({
                  message: "Application limit reached",
                });
                span.end();
              }
            })
            .catch((err) => {
              span.recordException(err);
              res.status(400).json(err);
              span.end();
            });
        })
        .catch((err) => {
          span.recordException(err);
          res.status(400).json(err);
          span.end();
        });
    })
    .catch((err) => {
      span.recordException(err);
      res.json(400).json(err);
      span.end();
    });
});

// recruiter gets applications for a particular job [pagination] [todo: test: done]
router.get("/jobs/:id/applications", jwtAuth, (req, res) => {

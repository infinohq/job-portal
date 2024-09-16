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

// To add new job
router.post("/jobs", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("POST /jobs");
  const user = req.user;
  span.setAttribute("user.type", user.type);

  if (user.type != "recruiter") {
    span.end();
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }

  const data = req.body;
  span.setAttribute("job.title", data.title);

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
      span.end();
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      span.recordException(err);
      span.end();
      res.status(400).json(err);
    });
});

// to get all the jobs [pagination] [for recruiter personal and for everyone]
router.get("/jobs", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("GET /jobs");
  let user = req.user;
  span.setAttribute("user.type", user.type);

  let findParams = {};
  let sortParams = {};

  // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

  // to list down jobs posted by a particular recruiter
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
    span.setAttribute("jobTypes", jobTypes);
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

  span.setAttribute("findParams", findParams);
  span.setAttribute("sortParams", sortParams);

  // Job.find(findParams).collation({ locale: "en" }).sort(sortParams);
  // .skip(skip)
  // .limit(limit)

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

  span.setAttribute("aggregationPipeline", arr);

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        span.end();
        res.status(404).json({
          message: "No job found",
        });
        return;
      }
      span.end();
      res.json(posts);
    })
    .catch((err) => {
      span.recordException(err);
      span.end();
      res.status(400).json(err);
    });
});

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("GET /jobs/:id");
  span.setAttribute("job.id", req.params.id);

  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        span.end();
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      span.end();
      res.json(job);
    })
    .catch((err) => {
      span.recordException(err);
      span.end();
      res.status(400).json(err);
    });
});

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("PUT /jobs/:id");
  const user = req.user;
  span.setAttribute("user.type", user.type);
  span.setAttribute("job.id", req.params.id);

  if (user.type != "recruiter") {
    span.end();
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
        span.end();
        res.status(404).json({
          message: "Job does not exist",
        });
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
          span.end();
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          span.recordException(err);
          span.end();
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      span.recordException(err);
      span.end();
      res.status(400).json(err);
    });
});

// to delete a job
router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("DELETE /jobs/:id");
  const user = req.user;
  span.setAttribute("user.type", user.type);
  span.setAttribute("job.id", req.params.id);

  if (user.type != "recruiter") {
    span.end();
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
        span.end();
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      span.end();
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      span.recordException(err);
      span.end();
      res.status(400).json(err);
    });
});

// get user's personal details
router.get("/user", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("GET /user");
  const user = req.user;
  span.setAttribute("user.type", user.type);

  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          span.end();
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        span.end();
        res.json(recruiter);
      })
      .catch((err) => {
        span.recordException(err);
        span.end();
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          span.end();
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        span.end();
        res.json(jobApplicant);
      })
      .catch((err) => {
        span.recordException(err);
        span.end();
        res.status(400).json(err);
      });
  }
});

// get user details from id
router.get("/user/:id", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("GET /user/:id");
  span.setAttribute("user.id", req.params.id);

  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        span.end();
        res.status(404).json({
          message: "User does not exist",
        });
        return;
      }

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              span.end();
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            span.end();
            res.json(recruiter);
          })
          .catch((err) => {
            span.recordException(err);
            span.end();
            res.status(400).json(err);
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              span.end();
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            span.end();
            res.json(jobApplicant);
          })
          .catch((err) => {
            span.recordException(err);
            span.end();
            res.status(400).json(err);
          });
      }
    })
    .catch((err) => {
      span.recordException(err);
      span.end();
      res.status(400).json(err);
    });
});

// update user details
router.put("/user", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("PUT /user");
  const user = req.user;
  const data = req.body;
  span.setAttribute("user.type", user.type);

  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          span.end();
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
            span.end();
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            span.recordException(err);
            span.end();
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        span.recordException(err);
        span.end();
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          span.end();
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
        jobApplicant
          .save()
          .then(() => {
            span.end();
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            span.recordException(err);
            span.end();
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        span.recordException(err);
        span.end();
        res.status(400).json(err);
      });
  }
});

// apply for a job [todo: test: done]
router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  const span = trace.getTracer("default").startSpan("POST /jobs/:id/applications");
  const user = req.user;
  span.setAttribute("user.type", user.type);
  span.setAttribute("job.id", req.params.id);

  if (user.type != "applicant") {
    span.end();
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
      if (appliedApplication !== null) {
        span.end();
        res.status(400).json({
          message: "You have already applied for this job",
        });
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
            span.end();
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
                              span.end();
                              res.json({
                                message: "Job application successful",
                              });
                            })
                            .catch((err) => {
                              span.recordException(err);
                              span.end();
                              res.status(400).json(err);
                            });
                        } else {
                          span.end();
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                        }
                      });
                    } else {
                      span.end();
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                    }
                  })
                  .catch((err) => {
                    span.recordException(err);
                    span.end();
                    res.status(400).json(err);
                  });
              } else {
                span.end();
                res.status(400).json({
                  message: "Application limit reached",
                });
              }
            })
            .catch((err) => {
              span.recordException(err);
              span.end();
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          span.recordException(err);
          span.end();
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      span.recordException(err);
      span.end();
      res.json(400).json(err);
    });
});

// recruiter gets applications for a particular job [pagination] [todo: test: done]
router.get("/jobs/:id/applications",

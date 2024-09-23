const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const { diag } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");

const meterProvider = new MeterProvider();
const meter = meterProvider.getMeter('default');

const jobAddCounter = meter.createCounter('job_add_counter', {
  description: 'Count of jobs added'
});
const jobAddErrorCounter = meter.createCounter('job_add_error_counter', {
  description: 'Count of errors when adding jobs'
});

const jobGetCounter = meter.createCounter('job_get_counter', {
  description: 'Count of job retrievals'
});
const jobGetErrorCounter = meter.createCounter('job_get_error_counter', {
  description: 'Count of errors when retrieving jobs'
});

const jobDetailGetCounter = meter.createCounter('job_detail_get_counter', {
  description: 'Count of job detail retrievals'
});
const jobDetailGetErrorCounter = meter.createCounter('job_detail_get_error_counter', {
  description: 'Count of errors when retrieving job details'
});

const jobUpdateCounter = meter.createCounter('job_update_counter', {
  description: 'Count of job updates'
});
const jobUpdateErrorCounter = meter.createCounter('job_update_error_counter', {
  description: 'Count of errors when updating jobs'
});

const jobDeleteCounter = meter.createCounter('job_delete_counter', {
  description: 'Count of job deletions'
});
const jobDeleteErrorCounter = meter.createCounter('job_delete_error_counter', {
  description: 'Count of errors when deleting jobs'
});

const userDetailGetCounter = meter.createCounter('user_detail_get_counter', {
  description: 'Count of user detail retrievals'
});
const userDetailGetErrorCounter = meter.createCounter('user_detail_get_error_counter', {
  description: 'Count of errors when retrieving user details'
});

const userIdDetailGetCounter = meter.createCounter('user_id_detail_get_counter', {
  description: 'Count of user ID detail retrievals'
});
const userIdDetailGetErrorCounter = meter.createCounter('user_id_detail_get_error_counter', {
  description: 'Count of errors when retrieving user ID details'
});

const userUpdateCounter = meter.createCounter('user_update_counter', {
  description: 'Count of user updates'
});
const userUpdateErrorCounter = meter.createCounter('user_update_error_counter', {
  description: 'Count of errors when updating users'
});

const jobApplicationCounter = meter.createCounter('job_application_counter', {
  description: 'Count of job applications'
});
const jobApplicationErrorCounter = meter.createCounter('job_application_error_counter', {
  description: 'Count of errors when applying for jobs'
});

const jobApplicationsGetCounter = meter.createCounter('job_applications_get_counter', {
  description: 'Count of job applications retrievals'
});
const jobApplicationsGetErrorCounter = meter.createCounter('job_applications_get_error_counter', {
  description: 'Count of errors when retrieving job applications'
});

const applicationsGetCounter = meter.createCounter('applications_get_counter', {
  description: 'Count of applications retrievals'
});
const applicationsGetErrorCounter = meter.createCounter('applications_get_error_counter', {
  description: 'Count of errors when retrieving applications'
});

const applicationStatusUpdateCounter = meter.createCounter('application_status_update_counter', {
  description: 'Count of application status updates'
});
const applicationStatusUpdateErrorCounter = meter.createCounter('application_status_update_error_counter', {
  description: 'Count of errors when updating application status'
});

const applicantsGetCounter = meter.createCounter('applicants_get_counter', {
  description: 'Count of applicants retrievals'
});
const applicantsGetErrorCounter = meter.createCounter('applicants_get_error_counter', {
  description: 'Count of errors when retrieving applicants'
});

const ratingUpdateCounter = meter.createCounter('rating_update_counter', {
  description: 'Count of rating updates'
});
const ratingUpdateErrorCounter = meter.createCounter('rating_update_error_counter', {
  description: 'Count of errors when updating ratings'
});

const personalRatingGetCounter = meter.createCounter('personal_rating_get_counter', {
  description: 'Count of personal rating retrievals'
});
const personalRatingGetErrorCounter = meter.createCounter('personal_rating_get_error_counter', {
  description: 'Count of errors when retrieving personal ratings'
});

const router = express.Router();

router.post("/jobs", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User attempting to add job:', user);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    jobAddErrorCounter.add(1);
    return;
  }

  const data = req.body;
  diag.debug('Job data received:', data);

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
      diag.debug('Job added successfully:', job);
      res.json({ message: "Job added successfully to the database" });
      jobAddCounter.add(1);
    })
    .catch((err) => {
      diag.error('Error adding job:', err);
      res.status(400).json(err);
      jobAddErrorCounter.add(1);
    });
});

router.get("/jobs", jwtAuth, (req, res) => {
  let user = req.user;
  diag.debug('User requesting jobs:', user);

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
    diag.debug('Job types filter:', jobTypes);
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

  diag.debug('Find parameters:', findParams);
  diag.debug('Sort parameters:', sortParams);

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

  diag.debug('Aggregation pipeline:', arr);

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        res.status(404).json({
          message: "No job found",
        });
        jobGetErrorCounter.add(1);
        return;
      }
      diag.debug('Jobs found:', posts);
      res.json(posts);
      jobGetCounter.add(1);
    })
    .catch((err) => {
      diag.error('Error fetching jobs:', err);
      res.status(400).json(err);
      jobGetErrorCounter.add(1);
    });
});

router.get("/jobs/:id", jwtAuth, (req, res) => {
  diag.debug('Fetching job with ID:', req.params.id);
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        res.status(400).json({
          message: "Job does not exist",
        });
        jobDetailGetErrorCounter.add(1);
        return;
      }
      diag.debug('Job found:', job);
      res.json(job);
      jobDetailGetCounter.add(1);
    })
    .catch((err) => {
      diag.error('Error fetching job:', err);
      res.status(400).json(err);
      jobDetailGetErrorCounter.add(1);
    });
});

router.put("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User attempting to update job:', user);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    jobUpdateErrorCounter.add(1);
    return;
  }
  Job.findOne({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job == null) {
        res.status(404).json({
          message: "Job does not exist",
        });
        jobUpdateErrorCounter.add(1);
        return;
      }
      const data = req.body;
      diag.debug('Job update data:', data);

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
          diag.debug('Job updated successfully:', job);
          res.json({
            message: "Job details updated successfully",
          });
          jobUpdateCounter.add(1);
        })
        .catch((err) => {
          diag.error('Error updating job:', err);
          res.status(400).json(err);
          jobUpdateErrorCounter.add(1);
        });
    })
    .catch((err) => {
      diag.error('Error finding job for update:', err);
      res.status(400).json(err);
      jobUpdateErrorCounter.add(1);
    });
});

router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User attempting to delete job:', user);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    jobDeleteErrorCounter.add(1);
    return;
  }
  Job.findOneAndDelete({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job === null) {
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        jobDeleteErrorCounter.add(1);
        return;
      }
      diag.debug('Job deleted successfully:', job);
      res.json({
        message: "Job deleted successfully",
      });
      jobDeleteCounter.add(1);
    })
    .catch((err) => {
      diag.error('Error deleting job:', err);
      res.status(400).json(err);
      jobDeleteErrorCounter.add(1);
    });
});

router.get("/user", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('Fetching personal details for user:', user);

  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          userDetailGetErrorCounter.add(1);
          return;
        }
        diag.debug('Recruiter details found:', recruiter);
        res.json(recruiter);
        userDetailGetCounter.add(1);
      })
      .catch((err) => {
        diag.error('Error fetching recruiter details:', err);
        res.status(400).json(err);
        userDetailGetErrorCounter.add(1);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          userDetailGetErrorCounter.add(1);
          return;
        }
        diag.debug('Job applicant details found:', jobApplicant);
        res.json(jobApplicant);
        userDetailGetCounter.add(1);
      })
      .catch((err) => {
        diag.error('Error fetching job applicant details:', err);
        res.status(400).json(err);
        userDetailGetErrorCounter.add(1);
      });
  }
});

router.get("/user/:id", jwtAuth, (req, res) => {
  diag.debug('Fetching user details for ID:', req.params.id);
  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        res.status(404).json({
          message: "User does not exist",
        });
        userIdDetailGetErrorCounter.add(1);
        return;
      }
      diag.debug('User data found:', userData);

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              res.status(404).json({
                message: "User does not exist",
              });
              userIdDetailGetErrorCounter.add(1);
              return;
            }
            diag.debug('Recruiter details found:', recruiter);
            res.json(recruiter);
            userIdDetailGetCounter.add(1);
          })
          .catch((err) => {
            diag.error('Error fetching recruiter details:', err);
            res.status(400).json(err);
            userIdDetailGetErrorCounter.add(1);
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              res.status(404).json({
                message: "User does not exist",
              });
              userIdDetailGetErrorCounter.add(1);
              return;
            }
            diag.debug('Job applicant details found:', jobApplicant);
            res.json(jobApplicant);
            userIdDetailGetCounter.add(1);
          })
          .catch((err) => {
            diag.error('Error fetching job applicant details:', err);
            res.status(400).json(err);
            userIdDetailGetErrorCounter.add(1);
          });
      }
    })
    .catch((err) => {
      diag.error('Error fetching user data:', err);
      res.status(400).json(err);
      userIdDetailGetErrorCounter.add(1);
    });
});

router.put("/user", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  diag.debug('User attempting to update personal details:', user);
  diag.debug('Update data:', data);

  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          userUpdateErrorCounter.add(1);
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
            diag.debug('Recruiter details updated successfully:', recruiter);
            res.json({
              message: "User information updated successfully",
            });
            userUpdateCounter.add(1);
          })
          .catch((err) => {
            diag.error('Error updating recruiter details:', err);
            res.status(400).json(err);
            userUpdateErrorCounter.add(1);
          });
      })
      .catch((err) => {
        diag.error('Error finding recruiter for update:', err);
        res.status(400).json(err);
        userUpdateErrorCounter.add(1);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          userUpdateErrorCounter.add(1);
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
        diag.debug('Job applicant update data:', jobApplicant);
        jobApplicant
          .save()
          .then(() => {
            diag.debug('Job applicant details updated successfully:', jobApplicant);
            res.json({
              message: "User information updated successfully",
            });
            userUpdateCounter.add(1);
          })
          .catch((err) => {
            diag.error('Error updating job applicant details:', err);
            res.status(400).json(err);
            userUpdateErrorCounter.add(1);
          });
      })
      .catch((err) => {
        diag.error('Error finding job applicant for update:', err);
        res.status(400).json(err);
        userUpdateErrorCounter.add(1);
      });
  }
});

router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User attempting to apply for job:', user);

  if (user.type != "applicant") {
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    jobApplicationErrorCounter.add(1);
    return;
  }
  const data = req.body;
  const jobId = req.params.id;
  diag.debug('Application data:', data);

  Application.findOne({
    userId: user._id,
    jobId: jobId,
    status: {
      $nin: ["deleted", "accepted", "cancelled"],
    },
  })
    .then((appliedApplication) => {
      diag.debug('Previously applied application:', appliedApplication);
      if (appliedApplication !== null) {
        res.status(400).json({
          message: "You have already applied for this job",
        });
        jobApplicationErrorCounter.add(1);
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
            res.status(404).json({
              message: "Job does not exist",
            });
            jobApplicationErrorCounter.add(1);
            return;
          }
          diag.debug('Job found for application:', job);

          Application.countDocuments({
            jobId: jobId,
            status: {
              $nin: ["rejected", "deleted", "cancelled", "finished"],
            },
          })
            .then((activeApplicationCount) => {
              diag.debug('Active application count for job:', activeApplicationCount);
              if (activeApplicationCount < job.maxApplicants) {
                Application.countDocuments({
                  userId: user._id,
                  status: {
                    $nin: ["rejected", "deleted", "cancelled", "finished"],
                  },
                })
                  .then((myActiveApplicationCount) => {
                    diag.debug('User active application count:', myActiveApplicationCount);
                    if (myActiveApplicationCount < 10) {
                      Application.countDocuments({
                        userId: user._id,
                        status: "accepted",
                      }).then((acceptedJobs) => {
                        diag.debug('User accepted jobs count:', acceptedJobs);
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
                              diag.debug('Job application successful:', application);
                              res.json({
                                message: "Job application successful",
                              });
                              jobApplicationCounter.add(1);
                            })
                            .catch((err) => {
                              diag.error('Error saving application:', err);
                              res.status(400).json(err);
                              jobApplicationErrorCounter.add(1);
                            });
                        } else {
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                          jobApplicationErrorCounter.add(1);
                        }
                      });
                    } else {
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                      jobApplicationErrorCounter.add(1);
                    }
                  })
                  .catch((err) => {
                    diag.error('Error counting user active applications:', err);
                    res.status(400).json(err);
                    jobApplicationErrorCounter.add(1);
                  });
              } else {
                res.status(400).json({
                  message: "Application limit reached",
                });
                jobApplicationErrorCounter.add(1);
              }
            })
            .catch((err) => {
              diag.error('Error counting active applications for job:', err);
              res.status(400).json(err);
              jobApplicationErrorCounter.add(1);
            });
        })
        .catch((err) => {
          diag.error('Error finding job for application:', err);
          res.status(400).json(err);
          jobApplicationErrorCounter.add(1);
        });
    })
    .catch((err) => {
      diag.error('Error checking previous applications:', err);
      res.json(400).json(err);
      jobApplicationErrorCounter.add(1);
    });
});

router.get("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User requesting applications for job:', user);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to view job applications",
    });
    jobApplicationsGetErrorCounter.add(1);
    return;
  }
  const jobId = req.params.id;
  diag.debug('Job ID for applications:', jobId);

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

  diag.debug('Find parameters for applications:', findParams);

  Application.find(findParams)
    .collation({ locale: "en" })
    .sort(sortParams)
    .then((applications) => {
      diag.debug('Applications found:', applications);
      res.json(applications);
      jobApplicationsGetCounter.add(1);
    })
    .catch((err) => {
      diag.error('Error fetching applications:', err);
      res.status(400).json(err);
      jobApplicationsGetErrorCounter.add(1);
    });
});

router.get("/applications", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User requesting all applications:', user);

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
      diag.debug('Applications found:', applications);
      res.json(applications);
      applicationsGetCounter.add(1);
    })
    .catch((err) => {
      diag.error('Error fetching all applications:', err);
      res.status(400).json(err);
      applicationsGetErrorCounter.add(1);
    });
});

router.put("/applications/:id", jwtAuth, (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;
  diag.debug('User attempting to update application status:', user);
  diag.debug('Application ID:', id, 'New status:', status);

  if (user.type === "recruiter") {
    if (status === "accepted") {
      Application.findOne({
        _id: id,
        recruiterId: user._id,
      })
        .then((application) => {
          if (application === null) {
            res.status(404).json({
              message: "Application not found",
            });
            applicationStatusUpdateErrorCounter.add(1);
            return;
          }
          diag.debug('Application found for acceptance:', application);

          Job.findOne({
            _id: application.jobId,
            userId: user._id,
          }).then((job) => {
            if (job === null) {
              res.status(404).json({
                message: "Job does not exist",
              });
              applicationStatusUpdateErrorCounter.add(1);
              return;
            }
            diag.debug('Job found for application acceptance:', job);

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
                              diag.debug('Application accepted and job updated:', application);
                              res.json({
                                message: `Application ${status} successfully`,
                              });
                              applicationStatusUpdateCounter.add(1);
                            })
                            .catch((err) => {
                              diag.error('Error updating job after acceptance:', err);
                              res.status(400).json(err);
                              applicationStatusUpdateErrorCounter.add(1);
                            });
                        } else {
                          res.json({
                            message: `Application ${status} successfully`,
                          });
                          applicationStatusUpdateCounter.add(1);
                        }
                      })
                      .catch((err) => {
                        diag.error('Error updating other applications after acceptance:', err);
                        res.status(400).json(err);
                        applicationStatusUpdateErrorCounter.add(1);
                      });
                  })
                  .catch((err) => {
                    diag.error('Error saving application after acceptance:', err);
                    res.status(400).json(err);
                    applicationStatusUpdateErrorCounter.add(1);
                  });
              } else {
                res.status(400).json({
                  message: "All positions for this job are already filled",
                });
                applicationStatusUpdateErrorCounter.add(1);
              }
            });
          });
        })
        .catch((err) => {
          diag.error('Error finding application for acceptance:', err);
          res.status(400).json(err);
          applicationStatusUpdateErrorCounter.add(1);
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
            res.status(400).json({
              message: "Application status cannot be updated",
            });
            applicationStatusUpdateErrorCounter.add(1);
            return;
          }
          diag.debug('Application status updated:', application);
          if (status === "finished") {
            res.json({
              message: `Job ${status} successfully`,
            });
          } else {
            res.json({
              message: `Application ${status} successfully`,
            });
          }
          applicationStatusUpdateCounter.add(1);
        })
        .catch((err) => {
          diag.error('Error updating application status:', err);
          res.status(400).json(err);
          applicationStatusUpdateErrorCounter.add(1);
        });
    }
  } else {
    if (status === "cancelled") {
      diag.debug('Applicant cancelling application:', id);
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
          diag.debug('Application cancelled:', tmp);
          res.json({
            message: `Application ${status} successfully`,
          });
          applicationStatusUpdateCounter.add(1);
        })
        .catch((err) => {
          diag.error('Error cancelling application:', err);
          res.status(400).json(err);
          applicationStatusUpdateErrorCounter.add(1);
        });
    } else {
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
      applicationStatusUpdateErrorCounter.add(1);
    }
  }
});

router.get("/applicants", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User requesting applicants list:', user);

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

    diag.debug('Find parameters for applicants:', findParams);
    diag.debug('Sort parameters for applicants:', sortParams);

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
          res.status(404).json({
            message: "No applicants found",
          });
          applicantsGetErrorCounter.add(1);
          return;
        }
        diag.debug('Applicants found:', applications);
        res.json(applications);
        applicantsGetCounter.add(1);
      })
      .catch((err) => {
        diag.error('Error fetching applicants:', err);
        res.status(400).json(err);
        applicantsGetErrorCounter.add(1);
      });
  } else {
    res.status(400).json({
      message: "You are not allowed to access applicants list",
    });
    applicantsGetErrorCounter.add(1);
  }
});

router.put("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  diag.debug('User attempting to add/update rating:', user);
  diag.debug('Rating data:', data);

  if (user.type === "recruiter") {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.applicantId,
      category: "applicant",
    })
      .then((rating) => {
        if (rating === null) {
          diag.debug('No existing rating found, creating new rating');
          Application.countDocuments({
            userId: data.applicantId,
            recruiterId: user._id,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              diag.debug('Accepted applicant count:', acceptedApplicant);
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
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          ratingUpdateErrorCounter.add(1);
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug('Calculated average rating:', avg);

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
                              res.status(400).json({
                                message:
                                  "Error while updating applicant's average rating",
                              });
                              ratingUpdateErrorCounter.add(1);
                              return;
                            }
                            diag.debug('Applicant rating updated successfully:', applicant);
                            res.json({
                              message: "Rating added successfully",
                            });
                            ratingUpdateCounter.add(1);
                          })
                          .catch((err) => {
                            diag.error('Error updating applicant rating:', err);
                            res.status(400).json(err);
                            ratingUpdateErrorCounter.add(1);
                          });
                      })
                      .catch((err) => {
                        diag.error('Error calculating average rating:', err);
                        res.status(400).json(err);
                        ratingUpdateErrorCounter.add(1);
                      });
                  })
                  .catch((err) => {
                    diag.error('Error saving new rating:', err);
                    res.status(400).json(err);
                    ratingUpdateErrorCounter.add(1);
                  });
              } else {
                res.status(400).json({
                  message:
                    "Applicant didn't worked under you. Hence you cannot give a rating.",
                });
                ratingUpdateErrorCounter.add(1);
              }
            })
            .catch((err) => {
              diag.error('Error counting accepted applicants:', err);
              res.status(400).json(err);
              ratingUpdateErrorCounter.add(1);
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
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    ratingUpdateErrorCounter.add(1);
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug('Calculated average rating:', avg);

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
                        res.status(400).json({
                          message:
                            "Error while updating applicant's average rating",
                        });
                        ratingUpdateErrorCounter.add(1);
                        return;
                      }
                      diag.debug('Applicant rating updated successfully:', applicant);
                      res.json({
                        message: "Rating updated successfully",
                      });
                      ratingUpdateCounter.add(1);
                    })
                    .catch((err) => {
                      diag.error('Error updating applicant rating:', err);
                      res.status(400).json(err);
                      ratingUpdateErrorCounter.add(1);
                    });
                })
                .catch((err) => {
                  diag.error('Error calculating average rating:', err);
                  res.status(400).json(err);
                  ratingUpdateErrorCounter.add(1);
                });
            })
            .catch((err) => {
              diag.error('Error saving updated rating:', err);
              res.status(400).json(err);
              ratingUpdateErrorCounter.add(1);
            });
        }
      })
      .catch((err) => {
        diag.error('Error finding existing rating:', err);
        res.status(400).json(err);
        ratingUpdateErrorCounter.add(1);
      });
  } else {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.jobId,
      category: "job",
    })
      .then((rating) => {
        diag.debug('Existing rating found:', rating);
        if (rating === null) {
          Application.countDocuments({
            userId: user._id,
            jobId: data.jobId,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              diag.debug('Accepted applicant count for job:', acceptedApplicant);
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
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          ratingUpdateErrorCounter.add(1);
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug('Calculated average rating for job:', avg);

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
                              res.status(400).json({
                                message:
                                  "Error while updating job's average rating",
                              });
                              ratingUpdateErrorCounter.add(1);
                              return;
                            }
                            diag.debug('Job rating updated successfully:', foundJob);
                            res.json({
                              message: "Rating added successfully",
                            });
                            ratingUpdateCounter.add(1);
                          })
                          .catch((err) => {
                            diag.error('Error updating job rating:', err);
                            res.status(400).json(err);
                            ratingUpdateErrorCounter.add(1);
                          });
                      })
                      .catch((err) => {
                        diag.error('Error calculating average rating for job:', err);
                        res.status(400).json(err);
                        ratingUpdateErrorCounter.add(1);
                      });
                  })
                  .catch((err) => {
                    diag.error('Error saving new job rating:', err);
                    res.status(400).json(err);
                    ratingUpdateErrorCounter.add(1);
                  });
              } else {
                res.status(400).json({
                  message:
                    "You haven't worked for this job. Hence you cannot give a rating.",
                });
                ratingUpdateErrorCounter.add(1);
              }
            })
            .catch((err) => {
              diag.error('Error counting accepted applicants for job:', err);
              res.status(400).json(err);
              ratingUpdateErrorCounter.add(1);
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
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    ratingUpdateErrorCounter.add(1);
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug('Calculated average rating for job:', avg);

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
                        res.status(400).json({
                          message: "Error while updating job's average rating",
                        });
                        ratingUpdateErrorCounter.add(1);
                        return;
                      }
                      diag.debug('Job rating updated successfully:', foundJob);
                      res.json({
                        message: "Rating added successfully",
                      });
                      ratingUpdateCounter.add(1);
                    })
                    .catch((err) => {
                      diag.error('Error updating job rating:', err);
                      res.status(400).json(err);
                      ratingUpdateErrorCounter.add(1);
                    });
                })
                .catch((err) => {
                  diag.error('Error calculating average rating for job:', err);
                  res.status(400).json(err);
                  ratingUpdateErrorCounter.add(1);
                });
            })
            .catch((err) => {
              diag.error('Error saving updated job rating:', err);
              res.status(400).json(err);
              ratingUpdateErrorCounter.add(1);
            });
        }
      })
      .catch((err) => {
        diag.error('Error finding existing job rating:', err);
        res.status(400).json(err);
        ratingUpdateErrorCounter.add(1);
      });
  }
});

router.get("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User requesting personal rating:', user);

  Rating.findOne({
    senderId: user._id,
    receiverId: req.query.id,
    category: user.type === "recruiter" ? "applicant" : "job",
  }).then((rating) => {
    if (rating === null) {
      diag.debug('No personal rating found');
      res.json({
        rating: -1,
      });
      personalRatingGetErrorCounter.add(1);
      return;
    }
    diag.debug('Personal rating found:', rating);
    res.json({
      rating: rating.rating,
    });
    personalRatingGetCounter.add(1);
  });
});

module.exports = router;

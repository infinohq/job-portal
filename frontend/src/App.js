import { createContext, useState } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Grid, makeStyles } from "@material-ui/core";
import { trace, metrics } from '@opentelemetry/api';

import Welcome, { ErrorPage } from "./component/Welcome";
import Navbar from "./component/Navbar";
import Login from "./component/Login";
import Logout from "./component/Logout";
import Signup from "./component/Signup";
import Home from "./component/Home";
import Applications from "./component/Applications";
import Profile from "./component/Profile";
import CreateJobs from "./component/recruiter/CreateJobs";
import MyJobs from "./component/recruiter/MyJobs";
import JobApplications from "./component/recruiter/JobApplications";
import AcceptedApplicants from "./component/recruiter/AcceptedApplicants";
import RecruiterProfile from "./component/recruiter/Profile";
import MessagePopup from "./lib/MessagePopup";
import isAuth, { userType } from "./lib/isAuth";

const useStyles = makeStyles((theme) => ({
  body: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "98vh",
    paddingTop: "64px",
    boxSizing: "border-box",
    width: "100%",
  },
}));

export const SetPopupContext = createContext();

const meter = metrics.getMeter('default');
const requestCounter = meter.createCounter('request_counter', {
  description: 'Counts the number of requests received',
});
const errorCounter = meter.createCounter('error_counter', {
  description: 'Counts the number of errors encountered',
});

function App() {
  const tracer = trace.getTracer('default');
  const classes = useStyles();
  const [popup, setPopup] = useState({
    open: false,
    severity: "",
    message: "",
  });

  tracer.startActiveSpan('App Component', span => {
    span.addEvent('Rendering App component');
    span.setAttribute('popupOpen', popup.open);
    span.setAttribute('popupSeverity', popup.severity);
    span.setAttribute('popupMessage', popup.message);

    return (
      <BrowserRouter>
        <SetPopupContext.Provider value={setPopup}>
          <Grid container direction="column">
            <Grid item xs>
              <Navbar />
            </Grid>
            <Grid item className={classes.body}>
              <Switch>
                <Route exact path="/">
                  {() => {
                    requestCounter.add(1, { route: '/' });
                    try {
                      return <Welcome />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/login">
                  {() => {
                    requestCounter.add(1, { route: '/login' });
                    try {
                      return <Login />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/login' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/signup">
                  {() => {
                    requestCounter.add(1, { route: '/signup' });
                    try {
                      return <Signup />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/signup' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/logout">
                  {() => {
                    requestCounter.add(1, { route: '/logout' });
                    try {
                      return <Logout />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/logout' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/home">
                  {() => {
                    requestCounter.add(1, { route: '/home' });
                    try {
                      return <Home />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/home' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/applications">
                  {() => {
                    requestCounter.add(1, { route: '/applications' });
                    try {
                      return <Applications />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/applications' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/profile">
                  {() => {
                    requestCounter.add(1, { route: '/profile' });
                    try {
                      return userType() === "recruiter" ? (
                        <RecruiterProfile />
                      ) : (
                        <Profile />
                      );
                    } catch (error) {
                      errorCounter.add(1, { route: '/profile' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/addjob">
                  {() => {
                    requestCounter.add(1, { route: '/addjob' });
                    try {
                      return <CreateJobs />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/addjob' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/myjobs">
                  {() => {
                    requestCounter.add(1, { route: '/myjobs' });
                    try {
                      return <MyJobs />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/myjobs' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/job/applications/:jobId">
                  {() => {
                    requestCounter.add(1, { route: '/job/applications/:jobId' });
                    try {
                      return <JobApplications />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/job/applications/:jobId' });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/employees">
                  {() => {
                    requestCounter.add(1, { route: '/employees' });
                    try {
                      return <AcceptedApplicants />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/employees' });
                      throw error;
                    }
                  }}
                </Route>
                <Route>
                  {() => {
                    requestCounter.add(1, { route: 'error' });
                    try {
                      return <ErrorPage />;
                    } catch (error) {
                      errorCounter.add(1, { route: 'error' });
                      throw error;
                    }
                  }}
                </Route>
              </Switch>
            </Grid>
          </Grid>
          <MessagePopup
            open={popup.open}
            setOpen={(status) =>
              setPopup({
                ...popup,
                open: status,
              })
            }
            severity={popup.severity}
            message={popup.message}
          />
        </SetPopupContext.Provider>
      </BrowserRouter>
    );
  });
}

export default App;

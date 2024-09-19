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
    span.addEvent('Initial popup state', { popup });

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
                    span.addEvent('Route accessed', { route: '/' });
                    try {
                      return <Welcome />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/' });
                      span.addEvent('Error encountered', { route: '/', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/login">
                  {() => {
                    requestCounter.add(1, { route: '/login' });
                    span.addEvent('Route accessed', { route: '/login' });
                    try {
                      return <Login />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/login' });
                      span.addEvent('Error encountered', { route: '/login', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/signup">
                  {() => {
                    requestCounter.add(1, { route: '/signup' });
                    span.addEvent('Route accessed', { route: '/signup' });
                    try {
                      return <Signup />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/signup' });
                      span.addEvent('Error encountered', { route: '/signup', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/logout">
                  {() => {
                    requestCounter.add(1, { route: '/logout' });
                    span.addEvent('Route accessed', { route: '/logout' });
                    try {
                      return <Logout />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/logout' });
                      span.addEvent('Error encountered', { route: '/logout', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/home">
                  {() => {
                    requestCounter.add(1, { route: '/home' });
                    span.addEvent('Route accessed', { route: '/home' });
                    try {
                      return <Home />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/home' });
                      span.addEvent('Error encountered', { route: '/home', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/applications">
                  {() => {
                    requestCounter.add(1, { route: '/applications' });
                    span.addEvent('Route accessed', { route: '/applications' });
                    try {
                      return <Applications />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/applications' });
                      span.addEvent('Error encountered', { route: '/applications', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/profile">
                  {() => {
                    requestCounter.add(1, { route: '/profile' });
                    span.addEvent('Route accessed', { route: '/profile' });
                    try {
                      return userType() === "recruiter" ? (
                        <RecruiterProfile />
                      ) : (
                        <Profile />
                      );
                    } catch (error) {
                      errorCounter.add(1, { route: '/profile' });
                      span.addEvent('Error encountered', { route: '/profile', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/addjob">
                  {() => {
                    requestCounter.add(1, { route: '/addjob' });
                    span.addEvent('Route accessed', { route: '/addjob' });
                    try {
                      return <CreateJobs />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/addjob' });
                      span.addEvent('Error encountered', { route: '/addjob', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/myjobs">
                  {() => {
                    requestCounter.add(1, { route: '/myjobs' });
                    span.addEvent('Route accessed', { route: '/myjobs' });
                    try {
                      return <MyJobs />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/myjobs' });
                      span.addEvent('Error encountered', { route: '/myjobs', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/job/applications/:jobId">
                  {() => {
                    requestCounter.add(1, { route: '/job/applications/:jobId' });
                    span.addEvent('Route accessed', { route: '/job/applications/:jobId' });
                    try {
                      return <JobApplications />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/job/applications/:jobId' });
                      span.addEvent('Error encountered', { route: '/job/applications/:jobId', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route exact path="/employees">
                  {() => {
                    requestCounter.add(1, { route: '/employees' });
                    span.addEvent('Route accessed', { route: '/employees' });
                    try {
                      return <AcceptedApplicants />;
                    } catch (error) {
                      errorCounter.add(1, { route: '/employees' });
                      span.addEvent('Error encountered', { route: '/employees', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
                <Route>
                  {() => {
                    requestCounter.add(1, { route: 'error' });
                    span.addEvent('Route accessed', { route: 'error' });
                    try {
                      return <ErrorPage />;
                    } catch (error) {
                      errorCounter.add(1, { route: 'error' });
                      span.addEvent('Error encountered', { route: 'error', error: error.message });
                      throw error;
                    }
                  }}
                </Route>
              </Switch>
            </Grid>
          </Grid>
          <MessagePopup
            open={popup.open}
            setOpen={(status) => {
              const newPopupState = {
                ...popup,
                open: status,
              };
              span.addEvent('Updating popup state', { newPopupState });
              setPopup(newPopupState);
            }}
            severity={popup.severity}
            message={popup.message}
          />
        </SetPopupContext.Provider>
      </BrowserRouter>
    );
  });
}

export default App;

import { useContext, useState } from "react";
import {
  Grid,
  TextField,
  Button,
  Typography,
  makeStyles,
  Paper,
} from "@material-ui/core";
import axios from "axios";
import { Redirect } from "react-router-dom";
import { trace } from '@opentelemetry/api';

import PasswordInput from "../lib/PasswordInput";
import EmailInput from "../lib/EmailInput";
import { SetPopupContext } from "../App";

import apiList from "../lib/apiList";
import isAuth from "../lib/isAuth";

const useStyles = makeStyles((theme) => ({
  body: {
    padding: "60px 60px",
  },
  inputBox: {
    width: "300px",
  },
  submitButton: {
    width: "300px",
  },
}));

const Login = (props) => {
  const classes = useStyles();
  const setPopup = useContext(SetPopupContext);

  const [loggedin, setLoggedin] = useState(isAuth());
  trace.getTracer('default').addEvent('isAuth called', { loggedin });

  const [loginDetails, setLoginDetails] = useState({
    email: "",
    password: "",
  });
  trace.getTracer('default').addEvent('Initial loginDetails state', { loginDetails });

  const [inputErrorHandler, setInputErrorHandler] = useState({
    email: {
      error: false,
      message: "",
    },
    password: {
      error: false,
      message: "",
    },
  });
  trace.getTracer('default').addEvent('Initial inputErrorHandler state', { inputErrorHandler });

  const handleInput = (key, value) => {
    trace.getTracer('default').addEvent('handleInput called', { key, value });
    setLoginDetails({
      ...loginDetails,
      [key]: value,
    });
    trace.getTracer('default').addEvent('Updated loginDetails state', { loginDetails });
  };

  const handleInputError = (key, status, message) => {
    trace.getTracer('default').addEvent('handleInputError called', { key, status, message });
    setInputErrorHandler({
      ...inputErrorHandler,
      [key]: {
        error: status,
        message: message,
      },
    });
    trace.getTracer('default').addEvent('Updated inputErrorHandler state', { inputErrorHandler });
  };

  const handleLogin = () => {
    trace.getTracer('default').addEvent('handleLogin called');
    const verified = !Object.keys(inputErrorHandler).some((obj) => {
      return inputErrorHandler[obj].error;
    });
    trace.getTracer('default').addEvent('Verification status', { verified });
    if (verified) {
      axios
        .post(apiList.login, loginDetails)
        .then((response) => {
          trace.getTracer('default').addEvent('Login successful', { response });
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("type", response.data.type);
          setLoggedin(isAuth());
          trace.getTracer('default').addEvent('Updated loggedin state', { loggedin });
          setPopup({
            open: true,
            severity: "success",
            message: "Logged in successfully",
          });
        })
        .catch((err) => {
          trace.getTracer('default').addEvent('Login failed', { err });
          setPopup({
            open: true,
            severity: "error",
            message: err.response.data.message,
          });
        });
    } else {
      setPopup({
        open: true,
        severity: "error",
        message: "Incorrect Input",
      });
    }
  };

  return loggedin ? (
    <Redirect to="/" />
  ) : (
    <Paper elevation={3} className={classes.body}>
      <Grid container direction="column" spacing={4} alignItems="center">
        <Grid item>
          <Typography variant="h3" component="h2">
            Login
          </Typography>
        </Grid>
        <Grid item>
          <EmailInput
            label="Email"
            value={loginDetails.email}
            onChange={(event) => handleInput("email", event.target.value)}
            inputErrorHandler={inputErrorHandler}
            handleInputError={handleInputError}
            className={classes.inputBox}
          />
        </Grid>
        <Grid item>
          <PasswordInput
            label="Password"
            value={loginDetails.password}
            onChange={(event) => handleInput("password", event.target.value)}
            className={classes.inputBox}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleLogin()}
            className={classes.submitButton}
          >
            Login
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Login;
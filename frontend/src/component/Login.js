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

  const [loginDetails, setLoginDetails] = useState({
    email: "",
    password: "",
  });

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

  const handleInput = (key, value) => {
    const tracer = trace.getTracer('default');
    tracer.startActiveSpan('handleInput', span => {
      setLoginDetails({
        ...loginDetails,
        [key]: value,
      });
      span.setAttribute('inputKey', key);
      span.setAttribute('inputValue', value);
      span.end();
    });
  };

  const handleInputError = (key, status, message) => {
    const tracer = trace.getTracer('default');
    tracer.startActiveSpan('handleInputError', span => {
      setInputErrorHandler({
        ...inputErrorHandler,
        [key]: {
          error: status,
          message: message,
        },
      });
      span.setAttribute('errorKey', key);
      span.setAttribute('errorStatus', status);
      span.setAttribute('errorMessage', message);
      span.end();
    });
  };

  const handleLogin = () => {
    const tracer = trace.getTracer('default');
    tracer.startActiveSpan('handleLogin', span => {
      const verified = !Object.keys(inputErrorHandler).some((obj) => {
        return inputErrorHandler[obj].error;
      });
      span.setAttribute('verified', verified);
      if (verified) {
        axios
          .post(apiList.login, loginDetails)
          .then((response) => {
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("type", response.data.type);
            setLoggedin(isAuth());
            setPopup({
              open: true,
              severity: "success",
              message: "Logged in successfully",
            });
            span.setAttribute('loginSuccess', true);
            span.setAttribute('responseToken', response.data.token);
            span.setAttribute('responseType', response.data.type);
            console.log(response);
          })
          .catch((err) => {
            setPopup({
              open: true,
              severity: "error",
              message: err.response.data.message,
            });
            span.setAttribute('loginSuccess', false);
            span.setAttribute('errorResponse', err.response.data.message);
            console.log(err.response);
          });
      } else {
        setPopup({
          open: true,
          severity: "error",
          message: "Incorrect Input",
        });
        span.setAttribute('loginSuccess', false);
        span.setAttribute('errorMessage', 'Incorrect Input');
      }
      span.end();
    });
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

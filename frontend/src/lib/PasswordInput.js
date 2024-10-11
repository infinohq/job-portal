import { useState } from "react";
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
} from "@material-ui/core";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import { trace } from '@opentelemetry/api';

const PasswordInput = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  const tracer = trace.getTracer('default');

  const handleShowPassword = () => {
    tracer.startActiveSpan('handleShowPassword', span => {
      setShowPassword(!showPassword);
      span.setAttribute('showPassword', !showPassword);
      span.addEvent('Toggled showPassword', { showPassword: !showPassword });
      span.end();
    });
  };

  const handleMouseDownPassword = (event) => {
    tracer.startActiveSpan('handleMouseDownPassword', span => {
      event.preventDefault();
      span.addEvent('Mouse down on password icon');
      span.end();
    });
  };

  return (
    <>
      <FormControl variant="outlined" error={props.error ? props.error : null}>
        <InputLabel htmlFor="outlined-adornment-password">
          {props.label}
        </InputLabel>
        <OutlinedInput
          id="outlined-adornment-password"
          type={showPassword ? "text" : "password"}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                onClick={handleShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          }
          value={props.value}
          onChange={(event) => {
            tracer.startActiveSpan('onChange', span => {
              props.onChange(event);
              span.setAttribute('value', event.target.value);
              span.addEvent('Password input changed', { value: event.target.value });
              span.end();
            });
          }}
          labelWidth={props.labelWidth ? props.labelWidth : 70}
          className={props.className}
          onBlur={(event) => {
            if (props.onBlur) {
              tracer.startActiveSpan('onBlur', span => {
                props.onBlur(event);
                span.addEvent('Password input lost focus');
                span.end();
              });
            }
          }}
        />
        {props.helperText ? (
          <FormHelperText>{props.helperText}</FormHelperText>
        ) : null}
      </FormControl>
    </>
  );
};

export default PasswordInput;

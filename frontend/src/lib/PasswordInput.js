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
      span.end();
    });
  };

  const handleMouseDownPassword = (event) => {
    tracer.startActiveSpan('handleMouseDownPassword', span => {
      event.preventDefault();
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
              span.end();
            });
          }}
          labelWidth={props.labelWidth ? props.labelWidth : 70}
          className={props.className}
          onBlur={props.onBlur ? props.onBlur : null}
        />
        {props.helperText ? (
          <FormHelperText>{props.helperText}</FormHelperText>
        ) : null}
      </FormControl>
    </>
  );
};

export default PasswordInput;

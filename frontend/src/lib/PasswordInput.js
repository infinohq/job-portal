import { useState } from "react";
import { trace } from "@opentelemetry/api";
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

const tracer = trace.getTracer("default");

const PasswordInput = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    const span = tracer.startSpan("handleShowPassword");
    setShowPassword(!showPassword);
    span.addEvent("Toggled showPassword", { showPassword: !showPassword });
    span.end();
  };

  const handleMouseDownPassword = (event) => {
    const span = tracer.startSpan("handleMouseDownPassword");
    event.preventDefault();
    span.addEvent("Mouse down on password field", { event });
    span.end();
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
            const span = tracer.startSpan("onChange");
            props.onChange(event);
            span.addEvent("Password input changed", { value: event.target.value });
            span.end();
          }}
          labelWidth={props.labelWidth ? props.labelWidth : 70}
          className={props.className}
          onBlur={(event) => {
            if (props.onBlur) {
              const span = tracer.startSpan("onBlur");
              props.onBlur(event);
              span.addEvent("Password input blurred", { event });
              span.end();
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
import { useState } from "react";
import { diag } from '@opentelemetry/api';
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

const PasswordInput = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  diag.debug('Initial showPassword state: ', showPassword);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
    diag.debug('Toggled showPassword state: ', !showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
    diag.debug('Mouse down event prevented on password input');
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
            diag.debug('Password input value changed: ', event.target.value);
            props.onChange(event);
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

import { TextField } from "@material-ui/core";
import { diag } from '@opentelemetry/api'; // Import OpenTelemetry for logging

const EmailInput = (props) => {
  const {
    label,
    value,
    onChange,
    inputErrorHandler,
    handleInputError,
    required,
    className,
  } = props;

  diag.debug('EmailInput props', { label, value, required, className });

  return (
    <TextField
      label={label}
      variant="outlined"
      value={value}
      onChange={onChange}
      helperText={inputErrorHandler.email.message}
      onBlur={(event) => {
        diag.debug('onBlur event triggered', { value: event.target.value });

        if (event.target.value === "") {
          diag.debug('Input value is empty');
          if (required) {
            diag.debug('Email is required');
            handleInputError("email", true, "Email is required");
          } else {
            diag.debug('Email is not required');
            handleInputError("email", false, "");
          }
        } else {
          const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          const isEmailValid = re.test(String(event.target.value).toLowerCase());
          diag.debug('Email validation result', { isEmailValid });

          if (isEmailValid) {
            handleInputError("email", false, "");
          } else {
            diag.debug('Incorrect email format');
            handleInputError("email", true, "Incorrect email format");
          }
        }
      }}
      error={inputErrorHandler.email.error}
      className={className}
    />
  );
};

export default EmailInput;

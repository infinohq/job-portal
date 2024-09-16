import { TextField } from "@material-ui/core";
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('email-input-tracer');

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

  return (
    <TextField
      label={label}
      variant="outlined"
      value={value}
      onChange={(event) => {
        const span = tracer.startSpan('onChange');
        span.setAttribute('value', event.target.value);
        onChange(event);
        span.end();
      }}
      helperText={inputErrorHandler.email.message}
      onBlur={(event) => {
        const span = tracer.startSpan('onBlur');
        span.setAttribute('value', event.target.value);
        if (event.target.value === "") {
          if (required) {
            handleInputError("email", true, "Email is required");
            span.setAttribute('error', 'Email is required');
          } else {
            handleInputError("email", false, "");
            span.setAttribute('error', 'Email is not required');
          }
        } else {
          const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (re.test(String(event.target.value).toLowerCase())) {
            handleInputError("email", false, "");
            span.setAttribute('error', 'No error');
          } else {
            handleInputError("email", true, "Incorrect email format");
            span.setAttribute('error', 'Incorrect email format');
          }
        }
        span.end();
      }}
      error={inputErrorHandler.email.error}
      className={className}
    />
  );
};

export default EmailInput;
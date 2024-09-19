import { Grid, Typography } from "@material-ui/core";
import { trace } from '@opentelemetry/api';

const Welcome = (props) => {
  const tracer = trace.getTracer('default');
  tracer.startActiveSpan('Welcome Component', span => {
    span.addEvent('Rendering Welcome component');
    span.addEvent('Props received', { props: JSON.stringify(props) });
    span.end();
  });

  return (
    <Grid
      container
      item
      direction="column"
      alignItems="center"
      justify="center"
      style={{ padding: "30px", minHeight: "93vh" }}
    >
      <Grid item>
        <Typography variant="h2">Welcome to Job Portal</Typography>
      </Grid>
    </Grid>
  );
};

export const ErrorPage = (props) => {
  const tracer = trace.getTracer('default');
  tracer.startActiveSpan('ErrorPage Component', span => {
    span.addEvent('Rendering ErrorPage component');
    span.addEvent('Props received', { props: JSON.stringify(props) });
    span.end();
  });

  return (
    <Grid
      container
      item
      direction="column"
      alignItems="center"
      justify="center"
      style={{ padding: "30px", minHeight: "93vh" }}
    >
      <Grid item>
        <Typography variant="h2">Error 404</Typography>
      </Grid>
    </Grid>
  );
};

export default Welcome;

const Sequence = ({ frame, from, durationInFrames, children }) => {
  if (frame >= from && frame <= durationInFrames) {
    return <div>{children}</div>;
  } else {
    null;
  }
};

export default Sequence;

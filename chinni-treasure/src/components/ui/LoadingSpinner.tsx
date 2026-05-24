interface Props {
  fullPage?: boolean;
}

export default function LoadingSpinner({ fullPage }: Props) {
  return (
    <div
      style={
        fullPage
          ? {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
            }
          : { textAlign: "center", padding: "60px 0" }
      }
    >
      <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
    </div>
  );
}

/**
 * The placeholder lines every admin mobile card skeleton draws: a title, a
 * subtitle, and a meta line. Three panels hand-printed these same three bars,
 * so a change to the skeleton rhythm reached only whichever panel was edited.
 */
export function CardSkeletonLines({
  titleWidth = "60%",
  subtitleWidth = "40%",
}: {
  titleWidth?: string | number;
  subtitleWidth?: string | number;
}) {
  return (
    <>
      <div className="skeleton-text" style={{ width: titleWidth, height: 14 }} />
      <div className="skeleton-text" style={{ width: subtitleWidth, height: 12, marginTop: 8 }} />
      <div className="skeleton-text" style={{ width: "30%", height: 12, marginTop: 14 }} />
    </>
  );
}
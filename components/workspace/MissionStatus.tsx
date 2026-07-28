type MissionStatusProps = {
  activeProjects: number;
  blocked: number;
  waitingOn: number;
  reviewsDue: number;
};

export function MissionStatus({ activeProjects, blocked, waitingOn, reviewsDue }: MissionStatusProps) {
  return (
    <div className="mission-strip mission-strip--widget" aria-label="Current operating status">
      <article>
        <span>Active work</span>
        <strong>{activeProjects}</strong>
        <small>projects moving</small>
      </article>
      <article className={blocked ? "has-alert" : ""}>
        <span>Blocked</span>
        <strong>{blocked}</strong>
        <small>need intervention</small>
      </article>
      <article>
        <span>Waiting</span>
        <strong>{waitingOn}</strong>
        <small>outside response</small>
      </article>
      <article className={reviewsDue ? "has-alert" : ""}>
        <span>Reviews due</span>
        <strong>{reviewsDue}</strong>
        <small>records need truth</small>
      </article>
    </div>
  );
}

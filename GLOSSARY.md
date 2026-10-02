# Domain glossary

## Training session ownership

A training session belongs to the User identified by its `athleteId`. The `actorId` identifies the authenticated User acting on training sessions. Only that owner can list, read, create, edit, delete, complete, or skip their training sessions, whether they are a guest or registered User. Ownership is checked before mutation input is read or validated. Another User's training session is forbidden; a missing training session is not found.

## Running metrics

The distance, elapsed duration, and pace of a run. A training session stores distance as whole metres and duration as whole seconds; pace is derived from those values. A User's measurement unit determines how a runner enters distance and pace. An unchanged rounded input must preserve the stored distance.

## Auto metric

The running metric calculated from the other two metrics in a run form. When a runner changes the Auto metric, they choose which of the other two metrics stays fixed; the remaining metric becomes Auto.

## User entry

Starting a guest session or completing sign-in with a verified external identity. A guest who registers with a new identity keeps their training sessions. If that identity already belongs to a registered User, the guest and their training sessions are deleted, and the existing User receives the new session.

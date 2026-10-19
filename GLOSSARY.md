# FreelanceHub

An internal company dashboard where owners post freelance projects, freelancers submit proposals, and an admin decides who may use the app.

## People

**Member**:
A user whom an admin has approved. Only members can use the dashboard.
_Avoid_: active user, approved account

**Admin**:
The member who approves people and oversees every project.
_Avoid_: superuser, moderator

**Owner**:
A member who posts and manages projects.
_Avoid_: client, employer

**Freelancer**:
A member who submits proposals and works on projects assigned to them.
_Avoid_: contractor, worker

## Access

**Sign-in**:
The single Telegram-based flow that covers both logging in and registering. The system decides which applies.
_Avoid_: signup, login (as separate flows)

**Authentication**:
Proving who a person is with a one-time code sent through Telegram.
_Avoid_: login check

**Auth Session**:
The short-lived Telegram handshake that ends with a verified one-time code.
_Avoid_: login session, OTP session

**Session**:
A signed-in user's ongoing access. It is renewed until they log out or are suspended.
_Avoid_: auth session

**Approval**:
The admin's decision that turns a pending user into a member, or rejects them.
_Avoid_: verification, activation

**Suspension**:
An admin blocking a member who was previously approved. It ends all of their sessions.
_Avoid_: ban, deactivation

**Authorization**:
Deciding whether a member may perform an action, based on their permissions.
_Avoid_: role check

**Permission**:
A named action that a role grants. It may be limited to the member's own projects, projects assigned to them, or proposals on their projects.
_Avoid_: right, capability

## Work

**Project**:
A piece of freelance work that an owner posts, with a price, a deadline and a status.
_Avoid_: job, gig, task

**Proposal**:
A freelancer's offer to do a project: a cover letter, a bid amount and an estimated duration.
_Avoid_: bid, application, offer

**Hire**:
Accepting one proposal. This assigns that freelancer to the project and rejects the other pending proposals.
_Avoid_: award, assign (as a separate action)

**Assigned freelancer**:
The freelancer whose proposal was accepted for a project.
_Avoid_: contractor, worker

**Closed**:
A project whose owner stopped accepting proposals without hiring anyone. It can be reopened.
_Avoid_: cancelled, archived

**Cancelled**:
A project that was abandoned for good. It cannot be reopened.
_Avoid_: closed, deleted

/** @format */

/**
 * SAH 2.0 Email Templates
 * All email template generation happens here in the web app
 */

/**
 * SAH 2.0 Email Header (common across all emails)
 */
function getEmailHeader(): string {
  return `
    <div style="background:#1a1a2e;padding:20px;text-align:center">
      <h1 style="color:#00d4ff;margin:0">Smart ABES Hackathon 2.0</h1>
      <p style="color:#aaa;margin:5px 0 0 0">Let's see whose Algorithm wins the Rhythm</p>
    </div>
  `;
}

/**
 * SAH 2.0 Email Footer (common across all emails)
 */
function getEmailFooter(): string {
  return `
    <div style="background:#1a1a2e;padding:10px;text-align:center">
      <p style="color:#888;font-size:12px;margin:0">
        Smart ABES Hackathon 2.0 | February 2026
      </p>
    </div>
  `;
}

/**
 * Template: Incomplete Team Alert
 */
export function generateIncompleteTeamEmail(
  recipientName: string,
  data: {
    teamName: string;
    teamCode: string;
    membersInTeam: number;
  },
): { subject: string; html: string } {
  const subject = `SAH 2.0 | ${data.teamName} - Registration Status Update`;

  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
    <div style="max-width:600px;margin:0 auto;padding:20px">
        ${getEmailHeader()}
       
        <div style="background:#fff3cd;padding:15px;border-left:4px solid #ffc107;margin:20px 0">
            ⚠️ <b>Action Required:</b> Your team has ${data.membersInTeam} members but registration is not yet submitted.<br>
            Please go to your Devfolio dashboard and click <b>"Submit Registration"</b> before 13th February 2026.
        </div>

        <div style="padding:20px;background:#f9f9f9">
            <p>Dear <strong>${recipientName}</strong>,</p>
           
            <p>Greetings from SAH 2.0 Organizing Team!</p>
           
            <p>Thank you for registering for <b>Smart ABES Hackathon 2.0</b>. We're excited to have your team on board!</p>
           
            <br><b>📅 Important Dates:</b>
            <ul>
                <li><b>Team Completion Deadline:</b> 1st February 2026</li>
                <li><b>Round 1 Evaluation:</b> 14-15 February 2026</li>
                <li><b>Mentoring Phase:</b> 16-27 February 2026</li>
                <li><b>Grand Finale:</b> 28 February 2026 @ ABES EC</li>
            </ul>
           
            <div style="background:#e8f4f8;padding:15px;border-left:4px solid #00d4ff;margin:20px 0">
                <strong>Your Team Details:</strong><br>
                Team Name: ${data.teamName}<br>
                Team Code: ${data.teamCode}<br>
                Members: ${data.membersInTeam}/4
            </div>
           
            <div>
              <p>
              For any queries, refer to our <b><a href="https://smartabeshackathon.tech/contacts">contact page</a></b>
              <br/>or<br/>
              Mail us at <b><a href="mailto:organizer@smartabeshackathon.tech">organizer@smartabeshackathon.tech</a></b></p>
              <p>If you want us to pair you with someone else, mail us at <b><a href="mailto:support@smartabeshackathon.tech">support@smartabeshackathon.tech</a></b></p>
            </div>
           
            <p>Best Regards,<br>
            <strong>SAH 2.0 Organizing Committee</strong></p>
        </div>
       
        ${getEmailFooter()}
    </div>
</div>
</body>
</html>`;

  return { subject, html };
}

/**
 * Template: Inauguration Invite
 */
export function generateInaugurationInviteEmail(
  recipientName: string,
  data: {
    eventDate: string;
    eventTime: string;
    venue: string;
  },
): { subject: string; html: string } {
  const subject = `SAH 2.0 | You're Invited to the Inauguration Ceremony`;

  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
    <div style="max-width:600px;margin:0 auto;padding:20px">
        ${getEmailHeader()}
       
        <div style="background:#d1f2eb;padding:15px;border-left:4px solid #00d4ff;margin:20px 0;text-align:center">
            <h2 style="color:#00695c;margin:0">You're Officially Invited! 🎉</h2>
        </div>

        <div style="padding:20px;background:#f9f9f9">
            <p>Dear <strong>${recipientName}</strong>,</p>
           
            <p>We are thrilled to invite you to the <b>Inauguration Ceremony</b> of <b>Smart ABES Hackathon 2.0</b>!</p>
           
            <div style="background:#e8f4f8;padding:20px;border-left:4px solid #00d4ff;margin:20px 0">
                <strong>📅 Event Details:</strong><br><br>
                <b>Date:</b> ${data.eventDate}<br>
                <b>Time:</b> ${data.eventTime}<br>
                <b>Venue:</b> ${data.venue}
            </div>
           
            <p>Join us for an exciting kickoff to what promises to be an amazing journey of innovation, collaboration, and learning!</p>
           
            <p>We look forward to seeing you there!</p>
           
            <div>
              <p>
              For any queries, refer to our <b><a href="https://smartabeshackathon.tech/contacts">contact page</a></b>
              <br/>or<br/>
              Mail us at <b><a href="mailto:organizer@smartabeshackathon.tech">organizer@smartabeshackathon.tech</a></b></p>
            </div>
           
            <p>Best Regards,<br>
            <strong>SAH 2.0 Organizing Committee</strong></p>
        </div>
       
        ${getEmailFooter()}
    </div>
</div>
</body>
</html>`;

  return { subject, html };
}

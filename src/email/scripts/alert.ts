/** @format */

import nodemailer from "nodemailer";

type IncompleteTeamAlertData = {
  teamCode: string;
  teamName: string;
  membersInTeam: number;
  recipientDetails: { name: string; email: string }[];
};

// Create transporter - configure with your SMTP settings
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate HTML email content
const generateEmailHTML = (
  memberName: string,
  teamData: IncompleteTeamAlertData,
) => {
  return `<!DOCTYPE html>
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
        <div style="background:#1a1a2e;padding:20px;text-align:center">
            <h1 style="color:#00d4ff;margin:0">Smart ABES Hackathon 2.0</h1>
            <p style="color:#aaa;margin:5px 0 0 0">Let's see whose algorithm wins the rhythm</p>
        </div>
       
           
<div style="background:#fff3cd;padding:15px;border-left:4px solid #ffc107;">
    ⚠️ <b>Action Required:</b> Your team has ${teamData.membersInTeam} members but registration is not yet submitted.<br>
    Please go to your Devfolio dashboard and click <b>"Submit Registration"</b> before 13th February 2026.
</div>

        <div style="padding:20px;background:#f9f9f9">
            <p>Dear <strong>${memberName}</strong>,</p>
           
            <p>Greetings from SAH 2.0 Organizing Team!</p>
           
            <p>Thank you for registering for <b>Smart ABES Hackathon 2.0</b>. We're excited to have your team on board!</p>
           
            <br><b>📅 Important Dates:</b>
            <ul>
                <li><b>Team Completion Deadline:</b> 5th February 2026</li>
                <li><b>Round 1 Evaluation:</b> 14-15 February 2026</li>
                <li><b>Mentoring Phase:</b> 16-27 February 2026</li>
                <li><b>Grand Finale:</b> 28 February 2026 @ ABES EC</li>
            </ul>
           
            <div style="background:#e8f4f8;padding:15px;border-left:4px solid #00d4ff;margin:20px 0">
                <strong>Your Team Details:</strong><br>
                Team Name: ${teamData.teamName}<br>
                Members: ${teamData.membersInTeam}/4
            </div>
           
            <p>For any queries, refer to our <b><a href="https://smartabeshackathon.tech/contacts">contact page</a></b></p>
           
            <p>Best Regards,<br>
            <strong>SAH 2.0 Organizing Committee</strong><br>
            ABES ACM | ABES ACM-W | SSCBS ACM | GGSIPU ACM</p>
        </div>
       
        <div style="background:#1a1a2e;padding:10px;text-align:center">
            <p style="color:#888;font-size:12px;margin:0">
                Smart ABES Hackathon 2.0 | February 2026
            </p>
        </div>
    </div>
</div>
</body>
</html>`;
};

// Generate plain text version
const generateEmailText = (
  memberName: string,
  teamData: IncompleteTeamAlertData,
) => {
  return `Smart ABES Hackathon 2.0
Multi-Chapter Collaborative Hackathon

Dear ${memberName},

Greetings from SAH 2.0 Organizing Team!

Thank you for registering for Smart ABES Hackathon 2.0. We're excited to have your team on board!

📅 Important Dates:
- Registration Deadline: 13th February 2026
- PPT Submission Deadline: 14th February 2026
- PPT Round: 14-15 February 2026
- Expert Review: 15-16 February 2026
- Mentoring Phase: 16-27 February 2026
- Grand Finale: 28 February 2026 @ ABES EC

📎 PPT Requirements:
- Problem Statement Understanding
- Proposed Solution Architecture
- Tech Stack & DSA/Algorithm Approach
- Team Capabilities & Roles

Your Team Details:
Team Name: ${teamData.teamName}
Team Code: ${teamData.teamCode}
Members: ${teamData.membersInTeam}/4

⚠️ Action Required: Your team has ${teamData.membersInTeam} members but registration is not yet submitted.
Please go to your Devfolio dashboard and click "Submit Registration" before 13th February 2026.

For any queries, contact us at sah@abes.ac.in

Best Regards,
SAH 2.0 Organizing Committee
ABES ACM | ABES ACM-W | SSCBS ACM | GGSIPU ACM

Smart ABES Hackathon 2.0 | February 2026`;
};

export const sendAlertEmail = async (data: IncompleteTeamAlertData) => {
  try {
    const transporter = createTransporter();

    // Send email to each member with generic greeting
    const emailPromises = data.recipientDetails.map(async (recipient) => {
      const memberName = recipient.name;

      const mailOptions = {
        from: `"SAH 2.0 Team" <${process.env.SMTP_USER || "noreply@sah.ac.in"}>`,
        to: recipient.email,
        subject: `SAH 2.0 | ${data.teamName} - Registration Status Update`,
        text: generateEmailText(memberName, data),
        html: generateEmailHTML(memberName, data),
      };

      return transporter.sendMail(mailOptions);
    });

    // Send all emails in parallel
    const results = await Promise.allSettled(emailPromises);

    // Log results
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `Alert emails sent for team ${data.teamCode}: ${successful} successful, ${failed} failed`,
    );

    console.log(
      `Emails sent for users ${data.recipientDetails.reduce((acc, item) => acc + " " + item.name, "")}`,
    );

    // Return summary
    return {
      success: failed === 0,
      sent: successful,
      failed: failed,
      teamCode: data.teamCode,
      teamName: data.teamName,
    };
  } catch (error) {
    console.error(
      `Error sending alert emails for team ${data.teamCode}:`,
      error,
    );
    throw error;
  }
};

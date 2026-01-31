/** @format */

import { Resend } from "resend";

const resend = new Resend("re_Du4Vk1x6_99LrnXLrWKYcBig4B43H3y7m");

const data = await resend.emails.send({
  from: "No Reply <noreply@smartabeshackathon.tech>",
  to: ["kunal.23b0121032@abes.ac.in"],
  subject: "IS LOGO THERE?",
  html: "<h1>IM NOT SURE THO</h1>",
});

console.log(data.data);

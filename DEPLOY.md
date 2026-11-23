# Deploying CATCO on Netlify

Use this directory as the Netlify project base. Publish the current directory with an empty build command. The site consists of prebuilt static files.

1. In the existing CATCO Netlify project, open Forms and enable form detection before deploying.
2. After the deploy finishes, confirm that Forms lists **catco-enquiry**.
3. In Forms → Submission notifications, add an email notification for verified submissions to **catco-enquiry**, addressed to **enquiries@catcoenergy.in**. Complete any recipient confirmation that Netlify requests.
4. Submit a clearly labelled test enquiry on the deployed domain. Verify the entry in the Netlify Forms dashboard and check the recipient inbox for the matching message. A successful form response confirms submission only. Inbox delivery requires this separate check.

The public contact email shown to visitors is **info@catcoenergy.com**.

[Netlify form setup](https://docs.netlify.com/manage/forms/setup/) · [Netlify form notifications](https://docs.netlify.com/manage/forms/notifications/)

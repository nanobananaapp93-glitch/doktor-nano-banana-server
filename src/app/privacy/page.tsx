import React from 'react';
import Section from '../components/Section';
import Markdown from 'react-markdown';


export default function Privacy() {
    return (
        <>
            <Section className="my-10">
                <article className="prose lg:prose-lg max-w-3xl pt-10">
                    <h1 className=' text-center text-indigo-900'>
                        Privacy Policy
                    </h1>
                    <Markdown>
                        {`                     
---
Privacy Policy
Nano Image Edit
Last Updated: October 20, 2025
This Privacy Policy explains how Nano Image Edit ("we", "us", or "our") collects, uses, and protects your personal information when you use our mobile application (the “App”). By using the App, you agree to the practices described in this Privacy Policy.

1. Information We Collect
a. Personal Data
We may collect limited personal information that you provide voluntarily, such as:
Email address (if you contact us for support or feedback)


Subscription or purchase details (handled by the app store, not stored by us)


We do not collect any biometric, facial recognition, or identity-verifying data.
b. Uploaded Images
When you upload an image to use the App’s editing or AI generation features:
The image is temporarily processed by our servers or third-party AI services to generate results.


Uploaded images are not shared, sold, or publicly displayed.


In most cases, images are automatically deleted from our systems shortly after processing is complete.


c. Usage Data
We may collect non-identifiable usage data such as:
Device type, OS version, and app version


IP address (for basic analytics and service security)


Feature usage statistics (to improve performance and design)


This data is collected automatically and cannot be used to identify you personally.

2. How We Use Your Information
We use the information we collect to:
Provide and operate the image editing and AI generation services


Improve app functionality, performance, and user experience


Respond to user inquiries and provide customer support


Monitor for abuse, fraud, or violations of our terms


Comply with legal obligations where applicable


We do not use uploaded photos or generated images for advertising, model training, or external research without your explicit consent.

3. Third-Party Services
Nano Image Edit may use third-party tools for analytics and AI processing. Examples include:
Vercel, MongoDB (for User credits and running image generation requests)


Cloud-based AI services that process uploaded images


Each third-party provider processes data in accordance with its own privacy policy and adheres to security and confidentiality obligations.

4. Data Retention
Uploaded images are kept only as long as needed to complete processing, then automatically deleted.


Analytical and device data may be retained longer to improve service stability and performance.


If you contact us by email, we may retain your message for record-keeping and support purposes.



5. Data Security
We take reasonable and industry-standard measures to protect your data against unauthorized access, alteration, or disclosure.
 However, no method of data transmission or electronic storage is completely secure, and we cannot guarantee absolute protection.

6. Children’s Privacy
Nano Image Edit is not intended for children under 13.
 We do not knowingly collect or process information from anyone under 13 years old.
 If you believe your child has used the App and submitted data, please contact us immediately at nanobananaapp93@gmail.com, and we will remove such information.

7. Your Rights (For EU and EEA Users)
If you are located in the European Economic Area (EEA), you have the right to:
Access, correct, or delete your personal information


Withdraw consent for processing


Request data portability


Object to certain types of processing


To exercise any of these rights, please contact us at nanobananaapp93@gmail.com.

8. Sharing of Information
We do not sell, rent, or trade user data.
 Information may be shared only when:
Required by law or government request


Necessary to enforce our terms or protect our rights


Needed to perform essential app functions through verified third-party providers



9. Links to Other Websites
The App may contain links to third-party websites or services.
 We are not responsible for the privacy practices or content of these sites and encourage you to review their respective privacy policies.

10. Changes to This Privacy Policy
We may update this Privacy Policy periodically to reflect service updates, new regulations, or feature changes.
 The revised version will always include the latest “Last Updated” date.
 By continuing to use the App after updates are posted, you agree to the revised terms.

11. Contact Us
If you have any questions, concerns, or data-related requests regarding this Privacy Policy, please contact us:
Email: nanobananaapp93@gmail.com




                        `}
                    </Markdown>
                </article>
            </Section>
        </>
    );
}

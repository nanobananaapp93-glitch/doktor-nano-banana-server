import React from 'react';
import Swagger from '../components/Swagger';
import Section from '../components/Section';
import Markdown from 'react-markdown';


export default function Terms() {
    return (
        <>
            <Section className="my-10">
                <article className="prose lg:prose-lg max-w-3xl pt-10">
                    <h1 className=' text-center text-indigo-900'>
                        Terms and Conditions
                    </h1>
                    <Markdown>
                        {`                     
---
Terms of Service
Nano Image Edit
Last Updated: October 20, 2025

1. Acceptance of Terms
By downloading, installing, or using the Nano Image Edit mobile application (“the App”), you agree to be bound by these Terms of Service (“Terms”).
 If you do not agree to these Terms, please do not install or use the App.
These Terms form a legally binding agreement between you and the developer (“we”, “us”, or “our”) regarding your use of the App and related services.

2. Description of Service
Nano Image Edit is a mobile application that allows users to generate, modify, and enhance images using artificial intelligence (AI) and advanced editing tools.
 The App is intended for personal and creative use only. Commercial use of the App’s output requires explicit written permission from the developer.

3. In-App Purchases and Subscriptions
The App may offer optional premium features or content through one-time purchases or auto-renewable subscriptions.
a. Subscription Options
Examples of available plans include (prices may vary by region or platform):
Weekly Subscription: Full access to all AI tools and styles


Yearly Subscription: Unlimited premium access for one year at a discounted rate


b. Renewal & Cancellation
Subscriptions renew automatically unless canceled at least 24 hours before the end of the billing period.
 You can manage or cancel subscriptions anytime in your device’s app store account settings.
c. Refund Policy
All payments are handled through the respective app store (Google Play or Apple App Store).
 We do not process or manage refunds directly. Refunds are subject to the policies of your app store provider.
d. Fair Use
We may apply fair usage limits to ensure stable service for all users. Excessive or automated use of AI features may lead to temporary restrictions.

4. User Responsibilities and Restrictions
You agree not to:
Use the App for any unlawful, harmful, or exploitative purpose


Upload, generate, or share content that is illegal, hateful, sexually explicit, violent, or discriminatory


Infringe upon the intellectual property or privacy rights of others


Attempt to reverse engineer, modify, or distribute any part of the App


Interfere with or disrupt the App’s performance or servers


We reserve the right to suspend or terminate your account for any misuse or violation of these Terms.

5. User-Generated Content and AI-Generated Images
When you upload or generate content using the App:
You retain ownership of your original uploaded images.


You grant us a limited, non-exclusive, revocable license to process your uploads solely to provide the App’s features.


AI-generated results are created automatically and may not be unique. Any resemblance to existing works or characters is purely coincidental.


You are solely responsible for how you use the generated content.
 Do not use outputs in ways that violate copyright laws, privacy rights, or applicable regulations.
We do not claim ownership of your uploaded content or generated images.

6. AI-Powered Image Processing Disclaimer
The App uses proprietary and/or third-party AI models to generate image results.
 AI-generated outputs are automatically produced based on user input and may include imperfections, artifacts, or unpredictable variations.
 We make no guarantees regarding the accuracy, quality, or realism of generated images.
The results are intended for creative and entertainment purposes only.

7. Termination
We may suspend or terminate your access to the App at any time if you:
Violate these Terms


Misuse the App


Engage in activities that harm other users or the App’s integrity


Upon termination, your right to use the App immediately ceases. You may uninstall the App at any time to discontinue use.

8. Disclaimer of Warranties
The App is provided on an “as-is” and “as-available” basis.
 We make no warranties, express or implied, regarding:
Continuous or error-free operation


The quality or accuracy of AI-generated outputs


Compatibility with all devices or systems


Use of the App is at your own risk.

9. Limitation of Liability
To the fullest extent permitted by law, the developer shall not be liable for any indirect, incidental, or consequential damages resulting from:
Your use or inability to use the App


Errors or delays in AI processing


Unauthorized access or loss of your data


Use of generated content that violates third-party rights


In no case shall our total liability exceed the amount you paid (if any) for the App or related services.

10. Changes to the App and Terms
We may modify, suspend, or discontinue parts of the App at any time without prior notice.
 We may also update these Terms occasionally.
 The updated version will be posted within the App or on our website with a new “Last Updated” date.
 Continued use of the App constitutes your acceptance of the revised Terms.

11. Governing Law
These Terms shall be governed and interpreted in accordance with the laws of the jurisdiction in which the developer operates.
 Any disputes shall be subject to the exclusive jurisdiction of the courts in that region.

12. Contact Us
If you have any questions about these Terms of Service, please contact us:
 Email: nanobananaapp93@gmail.com



                        `}
                    </Markdown>
                </article>
            </Section>
        </>

    );
}

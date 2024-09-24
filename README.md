VidShare (The Truman Platform)
=======================

**VidShare** is a video-based social media simulation platform built with **The Truman Platform** (see below for more info). In VidShare, users perceive they are participating in a real social media platform similar to YouTube Shorts and TikTok. The platform is fully immersive and allows users to interact with video content and other user comments.

Named after the 1998 film, The Truman Show, **The Truman Platform** is an open-source, complete social media simulation platform. It was developed as part of a joint effort by the [Cornell Social Media Lab (SML)](https://socialmedialab.cornell.edu/), led by former SML post-doc [Dominic DiFranzo](https://difranzo.com/), to provide researchers a community research infrastructure to conduct social media experiments in ecologically-valid realistic environments. Researchers can create different social media environments with a repertoire of features and affordances that fit their research goals and purposes, while ensuring participants have a naturalistic social media experience. 

This current iteration studies **effective objections against problematic content on social media**. 

Change the query parameters of the URL to be directed to the different experimental conditions. See below for more information.

**Study 1:**
* Branch: formal_study-official-code
  
| Query parameter  | Definition | Values |
| ------------- | ------------- | ------ |
| obj  | Indicates the justice type (type of objection) | 1, 2<br/><br/> 1: Retributive Objection<br/>2: Restorative Objection<br/> |
| m  | Indicates the justice message |  1, 2, 3<br/><br/> 1: Message #1<br/>2: Message #2<br/>3: Message #3 |
| off  | Indicates the offender's moral corrigibility |  0, 1, 2<br/><br/> 0: No information<br/>1: Repeated Offender<br/>2: First-Time Offender |

**Study 2:**
* Branch: main

| Query parameter  | Definition | Values |
| ------------- | ------------- | ------ |
| obj_1  | Indicates the first message | 0_1, 0_2, 1_1, 1_2, 2_1, 2_2 <br/><br/>0_1: Control Message #1<br/>0_2: Control Message #2<br/>1_1: Retributive Objection Message #1<br/>1_2: Retributive Objection Message #2<br/>2_1: Restorative Objection Message #1<br/>2_2: Restorative Objection Message #2 |
| obj_2  | Indicates the second message (if defined) |  1_1, 1_2, 2_1, 2_2 <br/><br/> 1_1: Retributive Objection Message #1<br/>1_2: Retributive Objection Message #2<br/>2_1: Restorative Objection Message #1<br/>2_2: Restorative Objection Message #2 |

### **Demo:** 
Coming soon.

### **Publications:** 
Coming soon.

### **Previous Research:**
Zhao, P., Bazarova, N. N., DiFranzo, D., Hui, W., Kizilcec, & Margolin, D. (2024). Standing up to problematic content on social media: which objection strategies draw the audience’s approval? _Journal of Computer-Mediated Communication_, 29(1). https://doi.org/10.1093/jcmc/zmad046

* Branch: pilot_study-official-code (Or see https://github.com/cornellsml/truman_objection for original codebase)

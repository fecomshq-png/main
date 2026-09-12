/* ---------------------------------------------------------------
   QUESTION DATA
   types: text | num | long | radio | check | grid
   req:   true = required before the form can be submitted
   grid:  "pct"  numeric percentage rows, totalled live
          other  radio matrix, needs cols[]
----------------------------------------------------------------*/
const SECTIONS = [
{
  id:"s1", title:"The current book", sub:"Rs 2.5 crore under management",
  note:"This section decides almost everything. Please be precise — estimates are fine where noted, guesses are not.",
  qs:[
    {id:"1.1", t:"How many individual clients or families make up the Rs 2.5 cr?", type:"num", req:true},
    {id:"1.2a", t:"Largest single client portfolio", type:"num", req:true, unit:"Rs"},
    {id:"1.2b", t:"Smallest single client portfolio", type:"num", req:true, unit:"Rs"},
    {id:"1.2c", t:"Median portfolio", type:"num", req:true, unit:"Rs", help:"The middle one, not the average."},
    {id:"1.2d", t:"How many clients are above Rs 25 lakh?", type:"num", req:true},
    {id:"1.3", t:"Under what arrangement do you handle this money today?", type:"check", req:true,
      opts:["ETS Investments / I am an AMFI-registered distributor (ARN holder) earning trail commission",
            "I charge clients a direct fee for advice",
            "Friends and family, no fee, informal",
            "Clients invest in their own names, I only guide them, no money comes to me",
            "Insurance commission",
            "Something else"]},
    {id:"1.4", t:"If you charge a fee today, describe it fully.", type:"long", req:true,
      help:"How much, how it is calculated, how it is collected (bank transfer, UPI, cash), whether it is billed by ETS Investments or personally, and whether you raise a GST invoice. If you ticked 'something else' above, explain it here."},
    {id:"1.5", t:"Do you have written signed agreements with these clients?", type:"radio", req:true,
      opts:["Yes, with all of them","Yes, with some of them","No, none"]},
    {id:"1.5b", t:"If some — how many have signed agreements?", type:"num"},
    {id:"1.6", t:"Roughly how is the Rs 2.5 cr split across asset types?", type:"grid", grid:"pct",
      rows:["Mutual funds","Direct equity","Fixed deposits and debt","Insurance-linked (ULIP, endowment)","PMS or AIF","Gold and other"],
      help:"Percentages, should total around 100."},
    {id:"1.7", t:"How did you get these clients?", type:"long",
      help:"Referrals from ex-colleagues, relationships kept from your banking years, family network, walk-ins, and so on."},
    {id:"1.8", t:"Have you lost any clients in the last two years? How many, and why?", type:"long"},
    {id:"1.9", t:"Are any clients NRIs or based outside India? How many, and which countries?", type:"long"},
    {id:"1.10", t:"What has this book earned you in the last 12 months, from all sources?", type:"num", req:true, unit:"Rs"},
    {id:"1.11", t:"What share of that income is recurring rather than one-time?", type:"num", unit:"%",
      help:"Recurring means trail commission and renewal fees. One-time means upfront commission and one-off fees."}
  ]
},
{
  id:"s2", title:"ETS Investments", sub:"The business you already have",
  note:"Having an entity already is an advantage, but its exact form determines the registration path, the cost and the timeline.",
  qs:[
    {id:"2.1", t:"What type of entity is ETS Investments?", type:"radio", req:true,
      opts:["Sole proprietorship","Partnership firm","LLP","Private Limited Company","Not formally registered — trading name only","Don't know"]},
    {id:"2.2", t:"Registration details", type:"long", req:true,
      help:"Date of incorporation or registration, registration number (CIN, LLPIN, GST, Udyam as applicable), and registered address."},
    {id:"2.3", t:"Who are the owners, partners or directors?", type:"long", req:true,
      help:"List everyone with their shareholding or partnership percentage."},
    {id:"2.4", t:"What does ETS Investments actually do today?", type:"long", req:true,
      help:"List every revenue line, even small ones."},
    {id:"2.5", t:"Which licences are held in whose name?", type:"grid", grid:"who",
      rows:["AMFI ARN","IRDAI (insurance)","GST","Any other"],
      cols:["ETS Investments","Lucky personally","Not held"]},
    {id:"2.5b", t:"Certificate and registration numbers, with expiry dates", type:"long",
      help:"For everything marked as held above. Name any 'other' licence here."},
    {id:"2.6", t:"Does ETS Investments have employees or associates?", type:"long", req:true,
      help:"How many, what they do, and whether any of them are licensed or certified."},
    {id:"2.7a", t:"ETS turnover, FY 2024-25", type:"num", req:true, unit:"Rs"},
    {id:"2.7b", t:"ETS profit, FY 2024-25", type:"num", req:true, unit:"Rs"},
    {id:"2.7c", t:"ETS turnover, FY 2025-26", type:"num", req:true, unit:"Rs"},
    {id:"2.7d", t:"ETS profit, FY 2025-26", type:"num", req:true, unit:"Rs"},
    {id:"2.8", t:"Are ETS Investments' statutory filings up to date?", type:"radio", req:true,
      opts:["Yes, all current","Mostly, with some pending","No, significantly behind","Don't know"],
      help:"Income tax returns, GST returns, ROC or MCA annual filings, audit."},
    {id:"2.8b", t:"If anything is pending or behind, what exactly?", type:"long"},
    {id:"2.9", t:"Any loans, liabilities, pending disputes or unpaid dues in the business?", type:"long"},
    {id:"2.10", t:"Are you attached to the name ETS Investments for the advisory practice?", type:"radio",
      opts:["Attached to it, want to keep it","Open to a new name for the advisory arm","Don't mind either way"],
      help:"SEBI is particular about entity names, and a distribution business and a fee-only advisory business may be better kept separate."},
    {id:"2.11", t:"What does ETS stand for?", type:"text"},
    {id:"2.12", t:"Any other business interests outside ETS Investments?", type:"long",
      help:"Another company, a partnership, a directorship, property rental, family business."},
    {id:"2.13", t:"Is ETS Investments your only source of income currently?", type:"radio", req:true, opts:["Yes","No"]},
    {id:"2.13b", t:"If no, what else?", type:"text"}
  ]
},
{
  id:"s3", title:"Qualifications", sub:"Degrees, certifications, work history",
  qs:[
    {id:"3.1", t:"Highest educational qualification", type:"long", req:true,
      help:"Degree name, subject, university or institution, year of completion. Note whether the institution is recognised by UGC, AICTE, or a State or Central Government."},
    {id:"3.2", t:"Which of these do you already hold?", type:"grid", grid:"hold",
      rows:["NISM Series V-A (Mutual Fund Distributors)","NISM Series X-A (Investment Adviser Level 1)","NISM Series X-B (Investment Adviser Level 2)","AMFI ARN","IRDAI agent or broker licence","JAIIB","CAIIB","IIBF Advanced Wealth Management Course","CFP","Other"],
      cols:["Hold it","Don't hold it","Expired"]},
    {id:"3.2b", t:"Certificate numbers and validity dates", type:"long",
      help:"For everything marked as held. Name any 'other' certification here."},
    {id:"3.3", t:"Have you ever attempted NISM X-A or X-B and not cleared them?", type:"long"},
    {id:"3.4", t:"Full employment history before ETS Investments", type:"long",
      help:"Employer, role, years, and what you actually did day to day. Needed both for the SEBI application and for your positioning story."},
    {id:"3.5", t:"Restrictive covenants and client origin", type:"long", req:true,
      help:"Did any previous employment contract contain a non-compete or non-solicit clause? Are any current clients people you first met at a previous employer, and roughly how many?"}
  ]
},
{
  id:"s4", title:"Compliance readiness", sub:"Fit-and-proper checks",
  note:"SEBI checks all of this. Saying 'no problem' without verifying is the fastest way to have an application rejected after money has already been spent. Nothing here is disqualifying on its own — undisclosed, it becomes fatal.",
  qs:[
    {id:"4.1", t:"Current CIBIL score", type:"num", req:true, help:"Please pull it before answering. It is free."},
    {id:"4.2", t:"Have you personally filed income tax returns for the last three financial years?", type:"radio", req:true,
      opts:["Yes, all three","Partially","No"]},
    {id:"4.3", t:"Has any of the following ever applied — to you, to ETS Investments, or to any entity where you were a director or partner?", type:"check", req:true,
      help:"Tick everything that applies. Tick the last option if none of them do.",
      opts:["Regulatory action, warning or show-cause notice from SEBI, RBI, IRDAI or AMFI",
            "Criminal case, FIR or conviction",
            "Bankruptcy, insolvency or loan default",
            "Cheque bounce proceedings (Section 138)",
            "Client complaint escalated to an ombudsman, consumer court or AMFI",
            "Tax demand, notice or scrutiny pending",
            "None of the above apply"]},
    {id:"4.3b", t:"Describe anything you ticked above", type:"long",
      help:"What happened, when, and how it was resolved. Please do not leave anything out."},
    {id:"4.4", t:"Do you work with a chartered accountant or company secretary?", type:"long",
      help:"Names and contact details if you are happy to share, and whether either has handled a SEBI intermediary registration before."}
  ]
},
{
  id:"s5", title:"Business model", sub:"The choices only you can make",
  note:"The plan branches differently depending on these answers. 'Don't know' is a legitimate answer to several of them.",
  qs:[
    {id:"5.1", t:"Are you willing to give up distribution commission entirely and run fee-only?", type:"radio", req:true,
      help:"A SEBI-registered adviser cannot earn both advisory fees and product commission from the same client. This applies at group and family level, so it covers ETS Investments too.",
      opts:["Yes, fully fee-only",
            "I want to keep commission income and I understand that limits me",
            "I would like to split it — distribution in one entity, advisory in another",
            "I don't know yet, I need to see the revenue comparison first"]},
    {id:"5.2", t:"If you go fee-only, how much annual commission income would you be giving up?", type:"num", req:true, unit:"Rs"},
    {id:"5.3a", t:"Primary client segment you want to serve", type:"radio", req:true,
      opts:["HNI — Rs 25 lakh to Rs 2 cr portfolios","Ultra-HNI — Rs 2 cr and above","Mass affluent — Rs 5 to 25 lakh","Mass retail — under Rs 5 lakh","NRI","Business owners and self-employed","Salaried professionals"]},
    {id:"5.3b", t:"Secondary client segment", type:"radio", req:true,
      opts:["HNI — Rs 25 lakh to Rs 2 cr portfolios","Ultra-HNI — Rs 2 cr and above","Mass affluent — Rs 5 to 25 lakh","Mass retail — under Rs 5 lakh","NRI","Business owners and self-employed","Salaried professionals","None, single segment focus"]},
    {id:"5.3c", t:"If you chose salaried professionals, which industries?", type:"text"},
    {id:"5.4", t:"Do you want to build a firm with a team, or stay a solo practitioner?", type:"radio", req:true,
      opts:["Solo, always — I want to personally handle every client","Solo now, team later if needed","Firm from the start — I want to build an institution"]},
    {id:"5.5", t:"Which fee model feels right to you?", type:"radio",
      opts:["Percentage of assets under advice, capped at 2.5% per family per year","Fixed annual fee per family, capped at Rs 1,51,000","Combination, varying by segment","Don't know, recommend one"]},
    {id:"5.6", t:"Which services do you want to offer?", type:"check",
      opts:["Full financial planning (goals, retirement, education, cash flow)","Investment advisory only","Tax planning","Insurance review, advice only, no selling","Estate and succession planning","Debt and loan restructuring advice","Business owner and promoter planning"]},
    {id:"5.7", t:"Geography and office", type:"long",
      help:"Delhi-NCR only, pan-India remote, or both? Do you have a physical office, and where?"},
    {id:"5.8", t:"Are you willing to serve clients entirely over video calls?", type:"radio",
      opts:["Yes, fully remote is fine","Mostly remote, but I need to meet big clients in person at least once","No, I need in-person meetings to close"]}
  ]
},
{
  id:"s6", title:"Time and capacity", sub:"What you can actually sustain",
  qs:[
    {id:"6.1", t:"Hours per week you can give to content creation", type:"num", req:true, unit:"hrs",
      help:"Scripting, filming, posting, replying to comments and messages."},
    {id:"6.2", t:"Hours per week for client servicing and acquisition calls", type:"num", req:true, unit:"hrs"},
    {id:"6.3", t:"How many clients do you believe you can personally service well?", type:"num",
      help:"At your current way of working, not an aspirational number."},
    {id:"6.4", t:"Who supports you today?", type:"long",
      help:"Assistant, operations person, junior, family member — and what they handle."},
    {id:"6.5", t:"What does a typical working week look like right now?", type:"long"}
  ]
},
{
  id:"s7", title:"Content and positioning", sub:"The brand you are building",
  note:"Already confirmed: you are comfortable on camera with face visible, and will create in a natural mix of Hindi, English and Punjabi. These questions go beyond that.",
  qs:[
    {id:"7.1", t:"Every social handle you currently have", type:"long", req:true,
      help:"Cover LinkedIn personal, LinkedIn ETS page, YouTube, Instagram, X, WhatsApp groups or channel, Facebook, anything else. Include follower counts and when you last posted. Write 'none' where you have nothing."},
    {id:"7.2", t:"Does the language mix change by platform and format?", type:"long", req:true,
      help:"For example Punjabi-heavy for community-facing reels, English-leaning for LinkedIn, Hindi for explainers. What feels natural to you?"},
    {id:"7.3", t:"Are you comfortable with long-form as well as short-form?", type:"radio", req:true,
      help:"A 15 to 20 minute YouTube video or a podcast-style conversation. This matters more than reels for converting high-ticket clients.",
      opts:["Yes, very comfortable","Comfortable but would need practice","I would prefer to stick to short-form"]},
    {id:"7.4", t:"Is there anything you are not willing to do for content?", type:"long", req:true,
      help:"Trending audio, dance or meme formats, aggressive thumbnails, sharing personal or family life, taking public positions on controversial topics. Write 'nothing is off limits' if that is true."},
    {id:"7.5", t:"What should the public-facing brand be?", type:"radio", req:true,
      opts:["Personal brand: Lucky Noor","ETS Investments as the brand","Personal brand feeding ETS Investments as the firm","A new firm name","Undecided"]},
    {id:"7.5b", t:"If a new firm name — any preferences?", type:"text"},
    {id:"7.6", t:"Do you own any domains or have handles reserved?", type:"long",
      help:"Including anything under the ETS name."},
    {id:"7.7", t:"Your professional story", type:"long", req:true, big:true,
      help:"200 to 400 words. Where you worked, what roles, what you did day to day, why you left the institutional world to start ETS Investments, and what you believe the banking industry gets wrong about advising customers. This becomes the spine of your positioning — a thin answer here weakens everything downstream."},
    {id:"7.8", t:"Three anonymised client stories", type:"long", req:true, big:true,
      help:"Cases where your advice materially changed an outcome, good or bad. No names, no identifying details. These become your highest-performing content."},
    {id:"7.9", t:"Your contrarian view", type:"long", req:true, big:true,
      help:"Something you believe about money or investing that most advisers in India would disagree with, and that you can defend with evidence."},
    {id:"7.10", t:"The three questions clients ask you most often", type:"long",
      help:"Word them the way clients actually say them, not the technical version."},
    {id:"7.11", t:"Which Indian finance creators do you follow and respect?", type:"long",
      help:"And which ones do you think are doing it badly, and why?"},
    {id:"7.12", t:"Which communities do you already belong to where your target clients are?", type:"long",
      help:"Alumni groups, RWA, trade associations, professional bodies, gurdwara or community organisations, business networks."}
  ]
},
{
  id:"s8", title:"Targets", sub:"What success actually means",
  qs:[
    {id:"8.1", t:"Is the Rs 100 cr figure assets under advice, or total portfolio value?", type:"radio", req:true,
      help:"Assets under advice is money you advise on and could charge a fee against. These are very different numbers and they lead to different plans.",
      opts:["Assets under advice — money I would charge a fee on","Total portfolio value including things I only track","Not sure of the difference, please explain"]},
    {id:"8.2", t:"By when do you want to reach Rs 100 cr?", type:"text", req:true, help:"A year is fine."},
    {id:"8.3", t:"What annual income do you want this business to produce for you personally at that point?", type:"num", req:true, unit:"Rs",
      help:"For context: Rs 100 cr under advice at a 1% fee is roughly Rs 1 cr of revenue before costs and tax. If your target is well above that, the assets number may be the wrong thing to chase."},
    {id:"8.4", t:"If you reached Rs 40 cr under advice and 120 quality clients in four years, with good income and a manageable workload — would that be failure?", type:"radio",
      opts:["No, I would be happy with that","Somewhat disappointed but I would continue","Yes, that would feel like failure"]},
    {id:"8.5", t:"Rank your real motivations", type:"grid", grid:"rank",
      rows:["Income","Independence and control","Recognition and being known","Building something that outlasts me","Helping people avoid financial mistakes"],
      cols:["1","2","3","4","5"], help:"1 is most important. Use each number once."},
    {id:"8.6", t:"What would make you abandon this plan?", type:"long"}
  ]
},
{
  id:"s9", title:"Constraints", sub:"Anything else I should know",
  qs:[
    {id:"9.1", t:"Is there anything in your history, or the business's history, that could surface publicly and damage the brand?", type:"long", req:true,
      help:"Better I know now. Write 'nothing' if there is nothing."},
    {id:"9.2", t:"Any family, health or personal constraints on your time or availability?", type:"long",
      help:"Including ability to work evenings and weekends, or to travel."},
    {id:"9.3", t:"Does your family support this direction?", type:"long",
      help:"And is anyone dependent on your income who would be affected by a lean 12 to 18 months?"},
    {id:"9.4", t:"Anything else this questionnaire did not ask?", type:"long"},
    {id:"docs", t:"Which documents are you sending separately?", type:"check",
      help:"Email or message these across. Tick what you are sending so I know what is still outstanding.",
      opts:["Degree certificate or marksheet",
            "Existing certification certificates (NISM, ARN, IRDAI, IIBF)",
            "ETS incorporation or registration certificate, PAN, GST certificate",
            "ETS financials for the last two years",
            "Previous employment contract with restrictive covenants",
            "CIBIL report",
            "Last three years of personal income tax acknowledgements",
            "Spreadsheet of the Rs 2.5 cr book (client initials, value, asset type, fee earned, start date)",
            "Screenshots of current social profiles and any content made so far"]},
    {id:"docs2", t:"Anything from that list you cannot provide, and why?", type:"long"}
  ]
}
];

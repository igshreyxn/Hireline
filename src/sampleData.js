import { STAGES, CLOSED, H, D } from './constants.js'

// Example roles and candidates so the desk opens with something to look at.
export function makeSample(now){
  const iso=t=>new Date(t).toISOString();
  const reqs={
    r_rsm_tm:{client:'RSM',clientContact:'Nikhil Bose, Talent Acquisition',title:'Technical Manager',location:'Kolkata · hybrid',ctcMin:28,ctcMax:35,expMin:10,expMax:14,positions:1,skills:['Java / Spring','AWS','Leads 8–12 engineers','Audit tech'],jd:'Leads an engineering team building internal audit and tax platforms. Client-facing delivery experience is a must.',status:'open',createdAt:iso(now-9*D),createdBy:'d_senior',example:true},
    r_kes_de:{client:'Kestrel Analytics',clientContact:'Sonal Mehta, HR',title:'Senior Data Engineer',location:'Bengaluru · on-site',ctcMin:22,ctcMax:30,expMin:5,expMax:8,positions:2,skills:['Spark','Airflow','Python','Snowflake'],jd:'Builds batch and streaming pipelines for retail analytics clients.',status:'open',createdAt:iso(now-6*D),createdBy:'d_senior',example:true},
    r_nw_hrbp:{client:'Northwind Logistics',clientContact:'Arjun Rao, HR Head',title:'HR Business Partner',location:'Pune · on-site',ctcMin:14,ctcMax:18,expMin:6,expMax:9,positions:1,skills:['Employee relations','Warehouse workforce','Labour law'],jd:'Partners with warehouse operations leadership across three sites.',status:'hold',createdAt:iso(now-14*D),createdBy:'d_admin',example:true},
  };
  const path=STAGES.map(s=>s.k);
  const cands={};
  const c=(id,name,reqId,stage,ageH,o)=>{
    const terminal=CLOSED[stage]?stage:null;
    const end=terminal?path.indexOf(o.from):path.indexOf(stage);
    const steps=path.slice(0,end+1); if(terminal) steps.push(terminal);
    const gap=o.gap||22; const times=[]; let t=now-ageH*H;
    for(let k=steps.length-1;k>=0;k--){times[k]=t;t-=gap*H;}
    const history=steps.map((s,k)=>({stage:s,at:iso(times[k]),by:k<2?o.junior:'d_senior'}));
    const out={name,reqId,stage,phone:o.phone,email:o.email,source:o.source,exp:o.exp,company:o.company,currentCtc:o.cur,expectedCtc:o.want,notice:o.notice,location:o.loc,owner:o.junior,
      notes:(o.notes||[]).map((n,i)=>({text:n,by:i===0?o.junior:'d_senior',at:history[Math.min(i+1,history.length-1)].at})),
      history,feedback:o.feedback||'',createdAt:history[0].at,updatedAt:history[history.length-1].at,example:true};
    const at=k=>{const i=steps.indexOf(k);return i>=0?iso(times[i]):undefined};
    if(at('submitted')) out.submittedAt=at('submitted');
    if(at('offer')) out.offerAt=at('offer');
    if(o.meetIn!=null) out.meetAt=iso(Math.round((now+o.meetIn*H)/(30*60e3))*30*60e3);
    cands[id]=out;
  };
  c('c01','Sourav Chatterjee','r_rsm_tm','offer',15,{junior:'d_junior1',phone:'+91 98300 41127',email:'sourav.c@example.com',source:'Naukri',exp:12,company:'Cognizant',cur:27,want:33,notice:60,loc:'Kolkata',meetIn:-40,notes:['Leads a 9-member Java team on a banking platform. Open to hybrid.','Client liked his audit-domain exposure. G-Meet done, offer sent.']});
  c('c02','Debolina Ghosh','r_rsm_tm','submitted',60,{junior:'d_junior1',phone:'+91 97480 22310',email:'debolina.g@example.com',source:'LinkedIn',exp:11,company:'TCS',cur:25,want:32,notice:90,loc:'Kolkata',notes:['Strong AWS, handles two client accounts.']});
  c('c03','Arindam Pal','r_rsm_tm','screened',5,{junior:'d_junior2',phone:'+91 90510 88412',email:'arindam.pal@example.com',source:'Naukri',exp:10,company:'Wipro',cur:24,want:30,notice:30,loc:'Kolkata',notes:['Serving notice, can join in 30 days. Wants to confirm hybrid days.']});
  c('c04','Kaushik Banerjee','r_rsm_tm','sourced',3,{junior:'d_junior2',phone:'+91 98740 55603',email:'kaushik.b@example.com',source:'LinkedIn',exp:13,company:'Capgemini',cur:30,want:38,notice:90,loc:'Bengaluru (open to Kolkata)'});
  c('c05','Tanmoy Saha','r_rsm_tm','rejected',30,{from:'submitted',junior:'d_junior1',phone:'+91 83360 19274',email:'tanmoy.s@example.com',source:'Indeed',exp:10,company:'HCLTech',cur:23,want:29,notice:60,loc:'Kolkata',feedback:'Client wants deeper hands-on AWS. Good people-management profile though.'});
  c('c06','Ritika Sharma','r_kes_de','interview',20,{junior:'d_junior1',phone:'+91 99720 30841',email:'ritika.s@example.com',source:'LinkedIn',exp:6,company:'Mu Sigma',cur:18,want:26,notice:60,loc:'Bengaluru',meetIn:3,feedback:'Strong on Spark tuning. Proceed to final round.'});
  c('c07','Vikram Reddy','r_kes_de','shortlisted',20,{junior:'d_junior2',phone:'+91 90080 67723',email:'vikram.r@example.com',source:'Naukri',exp:7,company:'Fractal',cur:21,want:28,notice:30,loc:'Hyderabad (relocating)',feedback:'Shortlisted. Please set up the final call this week.'});
  c('c08','Farhan Qureshi','r_kes_de','briefed',26,{junior:'d_junior1',phone:'+91 88610 44290',email:'farhan.q@example.com',source:'Indeed',exp:5,company:'Tiger Analytics',cur:16,want:23,notice:45,loc:'Bengaluru',notes:['Airflow + Snowflake daily. Keen on the retail domain.','Explained role and on-site policy. He is fine with 5 days.']});
  c('c09','Neha Kulkarni','r_kes_de','signed',70,{junior:'d_junior2',phone:'+91 97390 11857',email:'neha.k@example.com',source:'Referral',exp:6,company:'LatentView',cur:19,want:25,notice:30,loc:'Bengaluru',feedback:'Great fit, fast-track her.'});
  c('c10','Aditya Menon','r_kes_de','submitted',18,{junior:'d_junior1',phone:'+91 95670 20318',email:'aditya.m@example.com',source:'Foundit',exp:8,company:'Accenture',cur:24,want:31,notice:60,loc:'Kochi (open to Bengaluru)'});
  c('c11','Sneha Pillai','r_kes_de','sourced',1,{junior:'d_junior2',phone:'+91 94470 83625',email:'sneha.p@example.com',source:'Naukri',exp:5,company:'Infosys',cur:14,want:20,notice:90,loc:'Bengaluru'});
  c('c12','Manish Tiwari','r_nw_hrbp','dropped',50,{from:'screened',junior:'d_junior1',phone:'+91 98190 72046',email:'manish.t@example.com',source:'LinkedIn',exp:8,company:'Delhivery',cur:15,want:18,notice:60,loc:'Mumbai',notes:['Not open to relocating to Pune.']});
  c('c13','Kavya Joshi','r_nw_hrbp','screened',30,{junior:'d_junior2',phone:'+91 98220 61539',email:'kavya.j@example.com',source:'LinkedIn',exp:7,company:'Blue Dart',cur:13,want:17,notice:30,loc:'Pune',notes:['Handled a 400-person warehouse site. Hindi and Marathi.']});
  return {reqs,cands};
}


CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  salary text NOT NULL,
  description text NOT NULL,
  required_skills text[] NOT NULL DEFAULT '{}',
  preferred_skills text[] NOT NULL DEFAULT '{}',
  min_years numeric NOT NULL DEFAULT 0,
  education text NOT NULL DEFAULT '',
  certifications text[] NOT NULL DEFAULT '{}',
  embedding jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs are publicly readable" ON public.jobs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.resume_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  resume_name text NOT NULL,
  resume_hash text NOT NULL,
  profile jsonb NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX resume_analyses_device_idx ON public.resume_analyses (device_id, created_at DESC);
CREATE INDEX resume_analyses_hash_idx ON public.resume_analyses (device_id, resume_hash);
GRANT ALL ON public.resume_analyses TO service_role;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

INSERT INTO public.jobs (title, company, location, salary, description, required_skills, preferred_skills, min_years, education, certifications) VALUES
('Senior Data Engineer','Northstar Analytics','Bengaluru · Hybrid','₹24L–₹34L','Own batch and streaming data platforms, improve pipeline reliability, and guide warehouse architecture across product teams. You will design distributed ETL on Spark, manage AWS infrastructure, and model analytical datasets in Snowflake.','{Python,SQL,Apache Spark,AWS,ETL,Data Modeling}','{Snowflake,Terraform,Airflow}',5,'Bachelor''s degree in Computer Science or related field','{AWS Certified Data Analytics}'),
('Data Platform Engineer','Orbit Systems','Pune · Remote','₹20L–₹28L','Build reusable ingestion frameworks and production-grade orchestration for high-volume analytical workloads using Kafka, Airflow and dbt on containerised infrastructure.','{Python,ETL,Docker,SQL}','{Kafka,dbt,Airflow,Kubernetes}',3,'Bachelor''s degree in Engineering','{}'),
('Cloud Data Developer','Strataworks','Hyderabad · On-site','₹18L–₹25L','Develop cloud-native pipelines and dimensional models for customer intelligence and financial reporting on AWS Redshift.','{AWS,SQL,Pandas,Python}','{Redshift,Kubernetes,Glue}',2,'Bachelor''s degree','{AWS Certified Solutions Architect}'),
('Machine Learning Engineer','Vega Labs','Bengaluru · Hybrid','₹28L–₹40L','Ship production ML services: feature pipelines, model training, evaluation and deployment. Strong classical ML plus MLOps fundamentals expected.','{Python,scikit-learn,Machine Learning,SQL,Docker}','{MLflow,PyTorch,Kubernetes,Feature Engineering}',4,'Master''s degree in Computer Science, Statistics or related','{TensorFlow Developer Certificate}'),
('Data Analyst','BrightPath Retail','Chennai · On-site','₹9L–₹14L','Turn transactional and marketing data into dashboards and recommendations for merchandising leaders using SQL, Excel and BI tooling.','{SQL,Excel,Data Visualization,Statistics}','{Power BI,Tableau,Python}',1,'Bachelor''s degree','{}'),
('Backend Engineer (Python)','Corepoint Fintech','Mumbai · Hybrid','₹18L–₹26L','Build secure, high-throughput payment APIs in Python with PostgreSQL, Redis, and event-driven services on AWS.','{Python,PostgreSQL,REST API,AWS,Git}','{Redis,FastAPI,Kafka,Microservices}',3,'Bachelor''s degree in Computer Science','{}'),
('Analytics Engineer','Lumen Health','Remote (India)','₹16L–₹22L','Own the transformation layer: dbt models, data quality tests, and semantic definitions powering clinical and operational analytics.','{SQL,dbt,Data Modeling,Git}','{Snowflake,Python,Airflow,Looker}',2,'Bachelor''s degree','{}'),
('Full Stack Developer','Nimbus Studio','Bengaluru · Remote','₹14L–₹22L','Build customer-facing web products end to end with React, TypeScript, Node.js and PostgreSQL in a small product-led team.','{React,TypeScript,Node.js,PostgreSQL,Git}','{Next.js,GraphQL,AWS,Tailwind CSS}',2,'Bachelor''s degree','{}'),
('Business Intelligence Lead','Arcadia Logistics','Delhi NCR · On-site','₹22L–₹30L','Lead a BI team delivering supply-chain reporting, forecasting models and executive dashboards across a national network.','{SQL,Power BI,Data Warehousing,Stakeholder Management,Forecasting}','{Azure,Python,DAX}',6,'Bachelor''s degree; MBA preferred','{}'),
('Data Science Intern','Kite Research','Remote (India)','₹35k/month','Support research projects with data cleaning, exploratory analysis, and classical modelling experiments in Python notebooks.','{Python,Pandas,Statistics}','{scikit-learn,NLP,Matplotlib}',0,'Pursuing Bachelor''s or Master''s degree','{}');

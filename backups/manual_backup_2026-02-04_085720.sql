--
-- PostgreSQL database dump
--

\restrict 61ywjlpgEG1b6mqvqlZar4XicdNIhwBWXB8GbIm3fLoWdkyRwAMIwnbpKba655n

-- Dumped from database version 16.11
-- Dumped by pg_dump version 17.7 (Debian 17.7-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: drugs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drugs (
    id integer NOT NULL,
    product_id integer,
    supplier_id integer,
    batch_number character varying NOT NULL,
    expiry_date date NOT NULL,
    quantity integer,
    buying_price double precision NOT NULL,
    unit_price double precision NOT NULL,
    expiry_alert_days integer
);


ALTER TABLE public.drugs OWNER TO postgres;

--
-- Name: drugs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drugs_id_seq OWNER TO postgres;

--
-- Name: drugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drugs_id_seq OWNED BY public.drugs.id;


--
-- Name: generic_drugs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.generic_drugs (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying
);


ALTER TABLE public.generic_drugs OWNER TO postgres;

--
-- Name: generic_drugs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.generic_drugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.generic_drugs_id_seq OWNER TO postgres;

--
-- Name: generic_drugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.generic_drugs_id_seq OWNED BY public.generic_drugs.id;


--
-- Name: prescription_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescription_details (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    patient_age character varying,
    patient_sex character varying,
    prescriber_name character varying,
    medical_institution character varying,
    dosage_instructions text
);


ALTER TABLE public.prescription_details OWNER TO postgres;

--
-- Name: prescription_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prescription_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescription_details_id_seq OWNER TO postgres;

--
-- Name: prescription_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescription_details_id_seq OWNED BY public.prescription_details.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    brand_name character varying NOT NULL,
    generic_id integer,
    is_controlled boolean,
    reorder_level integer
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    transaction_id integer,
    drug_id integer,
    quantity integer NOT NULL,
    unit_price double precision NOT NULL,
    subtotal double precision NOT NULL
);


ALTER TABLE public.sale_items OWNER TO postgres;

--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_items_id_seq OWNER TO postgres;

--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_transactions (
    id integer NOT NULL,
    receipt_number character varying,
    patient_name character varying,
    total_amount double precision NOT NULL,
    "timestamp" timestamp without time zone,
    user_id integer
);


ALTER TABLE public.sales_transactions OWNER TO postgres;

--
-- Name: sales_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_transactions_id_seq OWNER TO postgres;

--
-- Name: sales_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_transactions_id_seq OWNED BY public.sales_transactions.id;


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    drug_id integer NOT NULL,
    movement_type character varying NOT NULL,
    quantity_changed integer NOT NULL,
    reason character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    "timestamp" timestamp with time zone DEFAULT now(),
    user_id integer
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movements_id_seq OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying NOT NULL,
    contact_person character varying,
    phone character varying,
    email character varying
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    role character varying,
    full_name character varying,
    hashed_password character varying NOT NULL,
    is_active boolean,
    recovery_pin_hash character varying NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: drugs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drugs ALTER COLUMN id SET DEFAULT nextval('public.drugs_id_seq'::regclass);


--
-- Name: generic_drugs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generic_drugs ALTER COLUMN id SET DEFAULT nextval('public.generic_drugs_id_seq'::regclass);


--
-- Name: prescription_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_details ALTER COLUMN id SET DEFAULT nextval('public.prescription_details_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_transactions ALTER COLUMN id SET DEFAULT nextval('public.sales_transactions_id_seq'::regclass);


--
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: drugs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drugs (id, product_id, supplier_id, batch_number, expiry_date, quantity, buying_price, unit_price, expiry_alert_days) FROM stdin;
\.


--
-- Data for Name: generic_drugs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.generic_drugs (id, name, description) FROM stdin;
\.


--
-- Data for Name: prescription_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescription_details (id, transaction_id, patient_age, patient_sex, prescriber_name, medical_institution, dosage_instructions) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, brand_name, generic_id, is_controlled, reorder_level) FROM stdin;
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_items (id, transaction_id, drug_id, quantity, unit_price, subtotal) FROM stdin;
\.


--
-- Data for Name: sales_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_transactions (id, receipt_number, patient_name, total_amount, "timestamp", user_id) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, drug_id, movement_type, quantity_changed, reason, created_at, updated_at, "timestamp", user_id) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, contact_person, phone, email) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, role, full_name, hashed_password, is_active, recovery_pin_hash) FROM stdin;
1	mike	admin	mike	$argon2id$v=19$m=65536,t=3,p=4$jdGa09rb25tTSilF6J3zPg$mJZUTIj3/1fQqXtYsbBh2Lft2v3DYimpjwQGhWyd1x4	t	$2b$12$WPXDCQlbSGZREfUcgAlrou.zrOc9a1LBJ8DzMTTKkGR1j/K0uWMSu
\.


--
-- Name: drugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drugs_id_seq', 1, false);


--
-- Name: generic_drugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.generic_drugs_id_seq', 1, false);


--
-- Name: prescription_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescription_details_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 1, false);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 1, false);


--
-- Name: sales_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_transactions_id_seq', 1, false);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: drugs drugs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drugs
    ADD CONSTRAINT drugs_pkey PRIMARY KEY (id);


--
-- Name: generic_drugs generic_drugs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generic_drugs
    ADD CONSTRAINT generic_drugs_pkey PRIMARY KEY (id);


--
-- Name: prescription_details prescription_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_details
    ADD CONSTRAINT prescription_details_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales_transactions sales_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_drugs_batch_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drugs_batch_number ON public.drugs USING btree (batch_number);


--
-- Name: ix_drugs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drugs_id ON public.drugs USING btree (id);


--
-- Name: ix_generic_drugs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_generic_drugs_id ON public.generic_drugs USING btree (id);


--
-- Name: ix_generic_drugs_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_generic_drugs_name ON public.generic_drugs USING btree (name);


--
-- Name: ix_prescription_details_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_prescription_details_id ON public.prescription_details USING btree (id);


--
-- Name: ix_products_brand_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_products_brand_name ON public.products USING btree (brand_name);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_sale_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sale_items_id ON public.sale_items USING btree (id);


--
-- Name: ix_sales_transactions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sales_transactions_id ON public.sales_transactions USING btree (id);


--
-- Name: ix_sales_transactions_receipt_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_sales_transactions_receipt_number ON public.sales_transactions USING btree (receipt_number);


--
-- Name: ix_stock_movements_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_movements_id ON public.stock_movements USING btree (id);


--
-- Name: ix_suppliers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);


--
-- Name: ix_suppliers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_suppliers_name ON public.suppliers USING btree (name);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: drugs drugs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drugs
    ADD CONSTRAINT drugs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: drugs drugs_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drugs
    ADD CONSTRAINT drugs_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: prescription_details prescription_details_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_details
    ADD CONSTRAINT prescription_details_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.sales_transactions(id);


--
-- Name: products products_generic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_generic_id_fkey FOREIGN KEY (generic_id) REFERENCES public.generic_drugs(id) ON DELETE SET NULL;


--
-- Name: sale_items sale_items_drug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_drug_id_fkey FOREIGN KEY (drug_id) REFERENCES public.drugs(id);


--
-- Name: sale_items sale_items_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.sales_transactions(id);


--
-- Name: sales_transactions sales_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: stock_movements stock_movements_drug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_drug_id_fkey FOREIGN KEY (drug_id) REFERENCES public.drugs(id);


--
-- Name: stock_movements stock_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 61ywjlpgEG1b6mqvqlZar4XicdNIhwBWXB8GbIm3fLoWdkyRwAMIwnbpKba655n


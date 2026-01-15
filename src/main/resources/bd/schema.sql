--
-- PostgreSQL database dump
--

\restrict t2qPoPbhhiqfb0G1wf62drB1A6tWKMmVgvPnWpKls3xubOh4nciuqoVMOaF7G4T

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: asistencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asistencia (
    dni character varying(255) NOT NULL,
    fecha_hora timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: detalle_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_pago (
    id_pago integer NOT NULL,
    numero integer NOT NULL,
    id_producto integer,
    id_sm integer,
    cantidad integer DEFAULT 1,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((cantidad)::numeric * precio_unitario)) STORED,
    CONSTRAINT ck_producto_o_membresia CHECK ((((id_producto IS NULL) AND (id_sm IS NOT NULL)) OR ((id_producto IS NOT NULL) AND (id_sm IS NULL)))),
    CONSTRAINT detalle_pago_precio_unitario_check CHECK ((precio_unitario > (0)::numeric))
);


--
-- Name: ejercicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ejercicio (
    id_ejercicio integer NOT NULL,
    id_grupo integer NOT NULL,
    nombre character varying(255) NOT NULL,
    video_url character varying(255),
    descripcion character varying(255)
);


--
-- Name: ejercicio_id_ejercicio_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ejercicio_id_ejercicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ejercicio_id_ejercicio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ejercicio_id_ejercicio_seq OWNED BY public.ejercicio.id_ejercicio;


--
-- Name: ejercicio_rutina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ejercicio_rutina (
    id_ejercicio integer NOT NULL,
    id_rutina integer NOT NULL
);


--
-- Name: empleado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleado (
    dni character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    telefono character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    fecha_nacimiento date NOT NULL,
    id_puesto integer NOT NULL,
    fecha_inicio date DEFAULT CURRENT_DATE,
    activo boolean DEFAULT true
);


--
-- Name: grupo_muscular; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupo_muscular (
    id_grupo integer NOT NULL,
    nombre character varying(255) NOT NULL
);


--
-- Name: grupo_muscular_id_grupo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grupo_muscular_id_grupo_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grupo_muscular_id_grupo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grupo_muscular_id_grupo_seq OWNED BY public.grupo_muscular.id_grupo;


--
-- Name: medio_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medio_pago (
    id_mediopago integer NOT NULL,
    nombre character varying(255) NOT NULL
);


--
-- Name: medio_pago_id_mediopago_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medio_pago_id_mediopago_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medio_pago_id_mediopago_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medio_pago_id_mediopago_seq OWNED BY public.medio_pago.id_mediopago;


--
-- Name: membresia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membresia (
    id_membresia integer NOT NULL,
    nombre character varying(255) NOT NULL,
    duracion_dias integer NOT NULL,
    precio_sugerido numeric(10,2) NOT NULL,
    activo boolean,
    asistencias_por_semana integer,
    tipo_membresia character varying(255),
    CONSTRAINT membresia_duracion_dias_check CHECK ((duracion_dias > 0)),
    CONSTRAINT membresia_precio_sugerido_check CHECK ((precio_sugerido > (0)::numeric)),
    CONSTRAINT membresia_tipo_membresia_check CHECK (((tipo_membresia)::text = ANY ((ARRAY['MUSCULACION'::character varying, 'FUNCIONAL'::character varying, 'MIXTA'::character varying])::text[])))
);


--
-- Name: membresia_id_membresia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.membresia_id_membresia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: membresia_id_membresia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.membresia_id_membresia_seq OWNED BY public.membresia.id_membresia;


--
-- Name: pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago (
    id_pago integer NOT NULL,
    id_mediopago integer NOT NULL,
    dni_empleado character varying(255) NOT NULL,
    dni_socio character varying(255),
    estado character varying(255) NOT NULL,
    fecha date DEFAULT CURRENT_DATE,
    monto numeric(10,2)
);


--
-- Name: pago_id_pago_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pago_id_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pago_id_pago_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pago_id_pago_seq OWNED BY public.pago.id_pago;


--
-- Name: producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto (
    id_producto integer NOT NULL,
    nombre character varying(255) NOT NULL,
    precio_sugerido numeric(10,2) NOT NULL,
    stock integer NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT producto_precio_sugerido_check CHECK ((precio_sugerido > (0)::numeric)),
    CONSTRAINT producto_stock_check CHECK ((stock >= 0))
);


--
-- Name: producto_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.producto_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: producto_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.producto_id_producto_seq OWNED BY public.producto.id_producto;


--
-- Name: puesto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.puesto (
    id_puesto integer NOT NULL,
    nombre character varying(255) NOT NULL
);


--
-- Name: puesto_id_puesto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.puesto_id_puesto_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: puesto_id_puesto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.puesto_id_puesto_seq OWNED BY public.puesto.id_puesto;


--
-- Name: rutina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rutina (
    dni_empleado character varying(255),
    descripcion character varying(255),
    nombre character varying(255) NOT NULL,
    fecha date DEFAULT CURRENT_DATE,
    dni_socio character varying(255),
    id_rutina integer NOT NULL
);


--
-- Name: rutina_id_rutina_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rutina_id_rutina_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rutina_id_rutina_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rutina_id_rutina_seq OWNED BY public.rutina.id_rutina;


--
-- Name: socio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socio (
    dni character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    telefono character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    fecha_nacimiento date NOT NULL,
    activo boolean
);


--
-- Name: socio_membresia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socio_membresia (
    id_sm integer NOT NULL,
    dni_socio character varying(255) NOT NULL,
    id_membresia integer NOT NULL,
    fecha_inicio date,
    fecha_hasta date,
    precio numeric(10,2),
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT socio_membresia_precio_check CHECK ((precio > (0)::numeric))
);


--
-- Name: socio_membresia_id_sm_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.socio_membresia_id_sm_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: socio_membresia_id_sm_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.socio_membresia_id_sm_seq OWNED BY public.socio_membresia.id_sm;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id bigint NOT NULL,
    activo boolean NOT NULL,
    password character varying(255),
    rol character varying(255),
    username character varying(255),
    empleado_dni character varying(255),
    socio_dni character varying(255),
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['ADMIN'::character varying, 'SOCIO'::character varying, 'EMPLEADO'::character varying])::text[])))
);


--
-- Name: usuario_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuario_seq
    START WITH 1
    INCREMENT BY 50
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ejercicio id_ejercicio; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio ALTER COLUMN id_ejercicio SET DEFAULT nextval('public.ejercicio_id_ejercicio_seq'::regclass);


--
-- Name: grupo_muscular id_grupo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_muscular ALTER COLUMN id_grupo SET DEFAULT nextval('public.grupo_muscular_id_grupo_seq'::regclass);


--
-- Name: medio_pago id_mediopago; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medio_pago ALTER COLUMN id_mediopago SET DEFAULT nextval('public.medio_pago_id_mediopago_seq'::regclass);


--
-- Name: membresia id_membresia; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia ALTER COLUMN id_membresia SET DEFAULT nextval('public.membresia_id_membresia_seq'::regclass);


--
-- Name: pago id_pago; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago ALTER COLUMN id_pago SET DEFAULT nextval('public.pago_id_pago_seq'::regclass);


--
-- Name: producto id_producto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto ALTER COLUMN id_producto SET DEFAULT nextval('public.producto_id_producto_seq'::regclass);


--
-- Name: puesto id_puesto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puesto ALTER COLUMN id_puesto SET DEFAULT nextval('public.puesto_id_puesto_seq'::regclass);


--
-- Name: rutina id_rutina; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rutina ALTER COLUMN id_rutina SET DEFAULT nextval('public.rutina_id_rutina_seq'::regclass);


--
-- Name: socio_membresia id_sm; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio_membresia ALTER COLUMN id_sm SET DEFAULT nextval('public.socio_membresia_id_sm_seq'::regclass);


--
-- Name: ejercicio ejercicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio
    ADD CONSTRAINT ejercicio_pkey PRIMARY KEY (id_ejercicio);


--
-- Name: empleado empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT empleado_pkey PRIMARY KEY (dni);


--
-- Name: grupo_muscular grupo_muscular_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_muscular
    ADD CONSTRAINT grupo_muscular_pkey PRIMARY KEY (id_grupo);


--
-- Name: medio_pago medio_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medio_pago
    ADD CONSTRAINT medio_pago_pkey PRIMARY KEY (id_mediopago);


--
-- Name: membresia membresia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT membresia_pkey PRIMARY KEY (id_membresia);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (id_pago);


--
-- Name: asistencia pk_asistencia; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia
    ADD CONSTRAINT pk_asistencia PRIMARY KEY (dni, fecha_hora);


--
-- Name: detalle_pago pk_detalle_pago; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pago
    ADD CONSTRAINT pk_detalle_pago PRIMARY KEY (id_pago, numero);


--
-- Name: ejercicio_rutina pk_ejercicio_rutina; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio_rutina
    ADD CONSTRAINT pk_ejercicio_rutina PRIMARY KEY (id_ejercicio, id_rutina);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id_producto);


--
-- Name: puesto puesto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puesto
    ADD CONSTRAINT puesto_pkey PRIMARY KEY (id_puesto);


--
-- Name: rutina rutina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rutina
    ADD CONSTRAINT rutina_pkey PRIMARY KEY (id_rutina);


--
-- Name: socio_membresia socio_membresia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio_membresia
    ADD CONSTRAINT socio_membresia_pkey PRIMARY KEY (id_sm);


--
-- Name: socio socio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio
    ADD CONSTRAINT socio_pkey PRIMARY KEY (dni);


--
-- Name: usuario uk530j7rtbay29tq6vql64l8eyr; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT uk530j7rtbay29tq6vql64l8eyr UNIQUE (empleado_dni);


--
-- Name: usuario uk863n1y3x0jalatoir4325ehal; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT uk863n1y3x0jalatoir4325ehal UNIQUE (username);


--
-- Name: membresia uk_membresia_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT uk_membresia_nombre UNIQUE (nombre);


--
-- Name: producto uk_producto_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT uk_producto_nombre UNIQUE (nombre);


--
-- Name: usuario ukgodi4hidljjivn4374hm7kp1e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT ukgodi4hidljjivn4374hm7kp1e UNIQUE (socio_dni);


--
-- Name: empleado uq_empleado_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT uq_empleado_email UNIQUE (email);


--
-- Name: empleado uq_empleado_telefono; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT uq_empleado_telefono UNIQUE (telefono);


--
-- Name: membresia uq_nombre_tipo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT uq_nombre_tipo UNIQUE (nombre, tipo_membresia);


--
-- Name: socio uq_socio_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio
    ADD CONSTRAINT uq_socio_email UNIQUE (email);


--
-- Name: socio uq_socio_telefono; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio
    ADD CONSTRAINT uq_socio_telefono UNIQUE (telefono);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: usuario fk83d0bvnltdmi7yix6amtj3ve; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fk83d0bvnltdmi7yix6amtj3ve FOREIGN KEY (empleado_dni) REFERENCES public.empleado(dni);


--
-- Name: asistencia fk_asis_socio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencia
    ADD CONSTRAINT fk_asis_socio FOREIGN KEY (dni) REFERENCES public.socio(dni);


--
-- Name: detalle_pago fk_dp_pago; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pago
    ADD CONSTRAINT fk_dp_pago FOREIGN KEY (id_pago) REFERENCES public.pago(id_pago) ON DELETE CASCADE;


--
-- Name: detalle_pago fk_dp_producto; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pago
    ADD CONSTRAINT fk_dp_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto);


--
-- Name: detalle_pago fk_dp_sm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pago
    ADD CONSTRAINT fk_dp_sm FOREIGN KEY (id_sm) REFERENCES public.socio_membresia(id_sm);


--
-- Name: ejercicio fk_ejer_grupo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio
    ADD CONSTRAINT fk_ejer_grupo FOREIGN KEY (id_grupo) REFERENCES public.grupo_muscular(id_grupo) ON DELETE CASCADE;


--
-- Name: empleado fk_emp_puesto; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT fk_emp_puesto FOREIGN KEY (id_puesto) REFERENCES public.puesto(id_puesto);


--
-- Name: ejercicio_rutina fk_er_ejercicio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio_rutina
    ADD CONSTRAINT fk_er_ejercicio FOREIGN KEY (id_ejercicio) REFERENCES public.ejercicio(id_ejercicio) ON DELETE CASCADE;


--
-- Name: ejercicio_rutina fk_er_rutina; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio_rutina
    ADD CONSTRAINT fk_er_rutina FOREIGN KEY (id_rutina) REFERENCES public.rutina(id_rutina);


--
-- Name: pago fk_pago_empleado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT fk_pago_empleado FOREIGN KEY (dni_empleado) REFERENCES public.empleado(dni);


--
-- Name: pago fk_pago_mediopago; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT fk_pago_mediopago FOREIGN KEY (id_mediopago) REFERENCES public.medio_pago(id_mediopago);


--
-- Name: pago fk_pago_socio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT fk_pago_socio FOREIGN KEY (dni_socio) REFERENCES public.socio(dni);


--
-- Name: rutina fk_rutina_empleado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rutina
    ADD CONSTRAINT fk_rutina_empleado FOREIGN KEY (dni_empleado) REFERENCES public.empleado(dni) ON DELETE SET NULL;


--
-- Name: rutina fk_rutina_socio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rutina
    ADD CONSTRAINT fk_rutina_socio FOREIGN KEY (dni_socio) REFERENCES public.socio(dni) ON DELETE CASCADE;


--
-- Name: socio_membresia fk_sm_membresia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio_membresia
    ADD CONSTRAINT fk_sm_membresia FOREIGN KEY (id_membresia) REFERENCES public.membresia(id_membresia);


--
-- Name: socio_membresia fk_sm_socio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socio_membresia
    ADD CONSTRAINT fk_sm_socio FOREIGN KEY (dni_socio) REFERENCES public.socio(dni);


--
-- Name: usuario fkr0tucbqhcvv223ylm3ajgqjr3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fkr0tucbqhcvv223ylm3ajgqjr3 FOREIGN KEY (socio_dni) REFERENCES public.socio(dni);


--
-- PostgreSQL database dump complete
--

\unrestrict t2qPoPbhhiqfb0G1wf62drB1A6tWKMmVgvPnWpKls3xubOh4nciuqoVMOaF7G4T


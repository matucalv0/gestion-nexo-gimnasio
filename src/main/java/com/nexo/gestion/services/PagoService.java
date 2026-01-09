package com.nexo.gestion.services;

import com.nexo.gestion.dto.DetallePagoCreateDTO;
import com.nexo.gestion.dto.PagoCreateDTO;
import com.nexo.gestion.dto.PagoDTO;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import io.jsonwebtoken.Jwt;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final DetallePagoRepository detallePagoRepository;
    private final SocioRepository socioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final MedioPagoRepository medioPagoRepository;
    private final ProductoRepository productoRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public PagoService(
            PagoRepository pagoRepository,
            DetallePagoRepository detallePagoRepository,
            SocioRepository socioRepository,
            EmpleadoRepository empleadoRepository,
            MedioPagoRepository medioPagoRepository,
            ProductoRepository productoRepository,
            SocioMembresiaRepository socioMembresiaRepository
    ) {
        this.pagoRepository = pagoRepository;
        this.detallePagoRepository = detallePagoRepository;
        this.socioRepository = socioRepository;
        this.empleadoRepository = empleadoRepository;
        this.medioPagoRepository = medioPagoRepository;
        this.productoRepository = productoRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
    }

    private PagoDTO convertirAPagoDTO(Pago pago) {
        return new PagoDTO(
                pago.getId_pago(),
                pago.getEstado(),
                pago.getFecha(),
                pago.getMonto()
        );
    }

    private Empleado obtenerEmpleadoAutenticado() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No hay usuario autenticado");
        }

        String dniEmpleado = auth.getName();

        return empleadoRepository.findById(dniEmpleado)
                .orElseThrow(() -> new ObjetoNoEncontradoException("empleado"));
    }



    private void renovarMembresia(SocioMembresia sm) {

        Membresia membresia = sm.getMembresia();

        LocalDate hoy = LocalDate.now();

        LocalDate inicio;
        if (sm.getFecha_hasta() != null && sm.getFecha_hasta().isAfter(hoy)) {
            // todavía activa → se extiende
            inicio = sm.getFecha_hasta().plusDays(1);
        } else {
            // vencida → se reinicia
            inicio = hoy;
        }

        LocalDate vencimiento = inicio.plusDays(membresia.getDuracion_dias());

        sm.setFecha_inicio(inicio);
        sm.setFecha_hasta(vencimiento);
        sm.setActiva(true);

        socioMembresiaRepository.save(sm);
    }

    private void validarDetalle(DetallePagoCreateDTO dDTO, Socio socio) {

        if (dDTO.getId_producto() != null && dDTO.getId_sm() != null) {
            throw new IllegalArgumentException("Un detalle no puede tener producto y membresía a la vez");
        }

        if (dDTO.getId_producto() == null && dDTO.getId_sm() == null) {
            throw new IllegalArgumentException("El detalle debe tener producto o membresía");
        }

        if (socio == null && dDTO.getId_sm() != null) {
            throw new IllegalArgumentException("Consumidor final no puede pagar membresías");
        }
    }



    @Transactional
    public PagoDTO crearPago(PagoCreateDTO dto) {

        Socio socio = null;
        if (dto.getDni_socio() != null) {
            socio = socioRepository.findById(dto.getDni_socio())
                    .orElseThrow(() -> new ObjetoNoEncontradoException("dni_socio"));
        }

        Empleado empleado = obtenerEmpleadoAutenticado();

        MedioPago medioPago = medioPagoRepository.findById(dto.getId_medioPago())
                .orElseThrow(() -> new ObjetoNoEncontradoException("id_mediopago"));

        Pago pago = new Pago(dto.getEstado(), socio, medioPago, empleado);
        pagoRepository.save(pago);

        int numero = 1;

        for (DetallePagoCreateDTO dDTO : dto.getDetalles()) {

            validarDetalle(dDTO, socio);

            DetallePago detalle = new DetallePago();
            detalle.setPago(pago);
            detalle.setCantidad(dDTO.getCantidad());
            detalle.setPrecio_unitario(dDTO.getPrecio_unitario());
            detalle.setId_detallepago(new DetallePagoId(pago.getId_pago(), numero++));

            if (dDTO.getId_producto() != null) {
                Producto p = productoRepository.findById(dDTO.getId_producto())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("producto"));
                detalle.setProducto(p);
            }

            if (dDTO.getId_sm() != null) {
                SocioMembresia sm = socioMembresiaRepository.findById(dDTO.getId_sm())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("socioMembresia"));

                if (!sm.getSocio().equals(socio)) {
                    throw new IllegalArgumentException("La membresía no pertenece al socio del pago");
                }

                renovarMembresia(sm);
                detalle.setSocioMembresia(sm);
            }

            pago.agregarDetalle(detalle);
        }

        BigDecimal monto = pagoRepository.sumarSubtotales(pago.getId_pago());
        pago.setMonto(monto);

        entityManager.flush();
        entityManager.refresh(pago);

        return convertirAPagoDTO(pago);
    }




    @Transactional(readOnly = true)
    public PagoDTO obtenerPago(Integer id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ObjetoNoEncontradoException("pago"));
        return convertirAPagoDTO(pago);
    }

    @Transactional(readOnly = true)
    public List<PagoDTO> buscarPagos() {
        return pagoRepository.findAll()
                .stream()
                .map(this::convertirAPagoDTO)
                .toList();
    }



    @Transactional
    public void anularPago(Integer id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ObjetoNoEncontradoException("pago"));

        if (pago.getEstado() == EstadoPago.ANULADO) {
            throw new IllegalStateException("El pago ya está anulado");
        }

        pago.setEstado(EstadoPago.ANULADO);


        // revertir membresías / stock / caja

        pagoRepository.save(pago);
    }
}


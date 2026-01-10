package com.nexo.gestion.services;

import com.nexo.gestion.dto.DetallePagoCreateDTO;
import com.nexo.gestion.dto.MembresiaVigenteDTO;
import com.nexo.gestion.dto.PagoCreateDTO;
import com.nexo.gestion.dto.PagoDTO;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private final MembresiaRepository membresiaRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public PagoService(
            MembresiaRepository membresiaRepository,
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
        this.membresiaRepository = membresiaRepository;
    }

    private PagoDTO convertirAPagoDTO(Pago pago) {
        return new PagoDTO(
                pago.getIdPago(),
                pago.getEstado(),
                pago.getFecha(),
                pago.getMonto()
        );
    }



    private SocioMembresia renovarMembresia(Socio socio, Membresia membresia) {
        if (!socioRepository.existsById(socio.getDni())){
            throw new ObjetoNoEncontradoException("No existe el socio con el dni: " + socio.getDni());
        }

        LocalDate inicio;

        if (socioRepository.existsMembresiaActiva(socio.getDni())){
            List<MembresiaVigenteDTO> vigentes = socioRepository.findMembresiasVigentes(socio.getDni());
            MembresiaVigenteDTO actual = vigentes.get(0);
            inicio = actual.vencimiento().plusDays(1);
        } else {
            inicio = LocalDate.now();
        }

        LocalDate vencimiento = inicio.plusDays(membresia.getDuracionDias());
        SocioMembresia nuevaSuscripcion = new SocioMembresia(socio, membresia, inicio, vencimiento);
        return socioMembresiaRepository.save(nuevaSuscripcion);
    }



    @Transactional
    public PagoDTO crearPago(PagoCreateDTO dto) {

        Socio socio = null;
        if (dto.getDniSocio() != null) {
            socio = socioRepository.findById(dto.getDniSocio())
                    .orElseThrow(() -> new ObjetoNoEncontradoException("dni_socio"));
        }

        Empleado empleado = empleadoRepository.findById(dto.getDniEmpleado()).orElseThrow(() -> new ObjetoNoEncontradoException("No se encontró el empleado con el dni " + dto.getDniEmpleado()));

        MedioPago medioPago = medioPagoRepository.findById(dto.getIdMedioPago())
                .orElseThrow(() -> new ObjetoNoEncontradoException("id_mediopago"));

        Pago pago = new Pago(dto.getEstado(), socio, medioPago, empleado);
        pagoRepository.save(pago);

        int numero = 1;

        for (DetallePagoCreateDTO dDTO : dto.getDetalles()) {

            DetallePago detalle = new DetallePago();
            detalle.setPago(pago);
            detalle.setCantidad(dDTO.getCantidad());
            detalle.setPrecioUnitario(dDTO.getPrecioUnitario());
            detalle.setIdDetallePago(new DetallePagoId(pago.getIdPago(), numero++));

            if (dDTO.getIdProducto() != null) {
                Producto p = productoRepository.findById(dDTO.getIdProducto())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("producto"));
                detalle.setProducto(p);
            }

            if (dDTO.getIdMembresia() != null) {
                if (socio == null){
                    throw new ObjetoNoEncontradoException("dni del socio");
                }

                Membresia membresia = membresiaRepository.findById(dDTO.getIdMembresia())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("membresia"));

                SocioMembresia nuevaSuscripcion = renovarMembresia(socio, membresia);
                socio.setActivo(true);
                detalle.setSocioMembresia(nuevaSuscripcion);
            }

            pago.agregarDetalle(detalle);
        }

        BigDecimal monto = pagoRepository.sumarSubtotales(pago.getIdPago());
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


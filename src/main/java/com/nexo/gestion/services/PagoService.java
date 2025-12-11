package com.nexo.gestion.services;

import com.nexo.gestion.dto.DetallePagoCreateDTO;
import com.nexo.gestion.dto.PagoCreateDTO;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    public PagoService(SocioMembresiaRepository socioMembresiaRepository, ProductoRepository productoRepository, MedioPagoRepository medioPagoRepository, PagoRepository pagoRepository, DetallePagoRepository detallePagoRepository, SocioRepository socioRepository, EmpleadoRepository empleadoRepository){
        this.pagoRepository = pagoRepository;
        this.detallePagoRepository = detallePagoRepository;
        this.socioRepository = socioRepository;
        this.empleadoRepository = empleadoRepository;
        this.medioPagoRepository = medioPagoRepository;
        this.productoRepository = productoRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
    }

    @Transactional
    public Pago crearPago(PagoCreateDTO pagoCreateDTO){
        Socio socio = null;  // si es a consumidor final, queda en null
        if (pagoCreateDTO.getDni_socio() != null){
            socio = socioRepository.findById(pagoCreateDTO.getDni_socio()).orElseThrow(()-> new ObjetoNoEncontradoException("dni_socio"));
        }

        Empleado empleado = empleadoRepository.findById(pagoCreateDTO.getDni_empleado()).orElseThrow(()-> new ObjetoNoEncontradoException("dni_empleado"));
        MedioPago medioPago = medioPagoRepository.findById(pagoCreateDTO.getId_medioPago()).orElseThrow(()-> new ObjetoNoEncontradoException("id_mediopago"));

        Pago pago = new Pago(pagoCreateDTO.getEstado(), socio, medioPago, empleado);
        pagoRepository.save(pago);

        int numero = 1;


        for (DetallePagoCreateDTO dDTO: pagoCreateDTO.getDetalles()){
            DetallePago d = new DetallePago();
            d.setPago(pago);

            if (dDTO.getId_producto() != null && dDTO.getId_sm() != null) {
                throw new IllegalArgumentException("Un detalle no puede tener producto y socioMembresia a la vez.");
            }
            if (dDTO.getId_producto() == null && dDTO.getId_sm() == null) {
                throw new IllegalArgumentException("El detalle debe tener producto o socioMembresia.");
            }
            if (socio == null && dDTO.getId_sm() != null) {
                throw new IllegalArgumentException(
                        "Un pago a consumidor final no puede tener detalles de socioMembresia."
                );
            }

            if (dDTO.getId_producto() != null) {
                Producto p = productoRepository.findById(dDTO.getId_producto())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("producto"));
                d.setProducto(p);
            }

            if (dDTO.getId_sm() != null) {
                SocioMembresia sm = socioMembresiaRepository.findById(dDTO.getId_sm())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("socioMembresia"));
                d.setSocioMembresia(sm);
            }

            DetallePagoId id = new DetallePagoId(pago.getId_pago(), numero++);
            d.setId_detallepago(id);
            d.setCantidad(dDTO.getCantidad());
            d.setPrecio_unitario(dDTO.getPrecio_unitario());

            pago.agregarDetalle(d);

        }

        BigDecimal sumaSubtotales = pagoRepository.sumarSubtotales(pago.getId_pago());

        pago.setMonto(sumaSubtotales);


        pagoRepository.save(pago);
        entityManager.flush();
        entityManager.refresh(pago);

        return pago;
    }

    public List<Pago> buscarPagos(){
        return pagoRepository.findAll();
    }


}

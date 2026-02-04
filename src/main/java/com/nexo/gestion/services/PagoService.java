package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.CantidadCeroDetalle;
import com.nexo.gestion.exceptions.MasDeUnaMembresiaEnDetalleException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final SocioRepository socioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final MedioPagoRepository medioPagoRepository;
    private final ProductoRepository productoRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;
    private final MembresiaRepository membresiaRepository;
    private final AsistenciaRepository asistenciaRepository;

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
            SocioMembresiaRepository socioMembresiaRepository,
            AsistenciaRepository asistenciaRepository
    ) {
        this.pagoRepository = pagoRepository;
        this.socioRepository = socioRepository;
        this.empleadoRepository = empleadoRepository;
        this.medioPagoRepository = medioPagoRepository;
        this.productoRepository = productoRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.membresiaRepository = membresiaRepository;
        this.asistenciaRepository = asistenciaRepository;
    }

    private DetallePagoDTO convertirDetallePagoADTO(DetallePago detallePago) {

        Integer idProducto = null;
        Integer idMembresia = null;
        String tipo = null;
        String nombre = null;

        if (detallePago.getProducto() != null) {
            idProducto = detallePago.getProducto().getIdProducto();
            tipo = "Producto";
            nombre = detallePago.getProducto().getNombre();
        } else if (detallePago.getSocioMembresia() != null) {
            idMembresia = detallePago.getSocioMembresia()
                    .getMembresia()
                    .getIdMembresia();
            tipo = "Membresía";
            nombre = detallePago.getSocioMembresia().getMembresia().getNombre();
        }

        return new DetallePagoDTO(
                tipo,
                nombre,
                detallePago.getCantidad(),
                detallePago.getPrecioUnitario(),
                idProducto,
                idMembresia
        );
    }


    private PagoDTO convertirAPagoDTO(Pago pago) {
        List<DetallePago> detalle = pago.getDetalles();
        List<DetallePagoDTO> detalleDTO = new ArrayList<>();

        for (DetallePago d: detalle){
            detalleDTO.add(convertirDetallePagoADTO(d));

        }

        return new PagoDTO(
                pago.getIdPago(),
                pago.getEstado(),
                pago.getFecha(),
                pago.getMonto(),
                detalleDTO
        );
    }

    private SocioMembresia renovarMembresia(Socio socio, Membresia membresia) {
        if (!socioRepository.existsById(socio.getDni())){
            throw new ObjetoNoEncontradoException("No existe el socio con el dni: " + socio.getDni());
        }



        LocalDate ultimoVencimiento =
                socioMembresiaRepository.findUltimoVencimientoVigente(socio.getDni());

        LocalDate inicio = (ultimoVencimiento != null)
                ? ultimoVencimiento.plusDays(1)
                : LocalDate.now();

        Integer asistenciasPendientes = asistenciaRepository.asistenciasPendientesSocio(socio.getDni());

        if (asistenciasPendientes > 0){
            java.time.Instant fechaInstant = asistenciaRepository.fechaPrimeraAsistenciasPendiente(socio.getDni());
            inicio = fechaInstant.atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        }

        LocalDate vencimiento = inicio.plusDays(membresia.getDuracionDias());

        SocioMembresia nuevaSuscripcion = new SocioMembresia(socio, membresia, inicio, vencimiento);

        List<Asistencia> pendientes = asistenciaRepository
                .findPendientesEnRango(
                        socio.getDni(),
                        inicio.atStartOfDay(),
                        vencimiento.atTime(java.time.LocalTime.MAX)
                );



        for (Asistencia asistencia : pendientes) {
            asistencia.setEstadoAsistencia(EstadoAsistencia.VALIDA);
        }

        asistenciaRepository.saveAll(pendientes);
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

            if (dDTO.getCantidad() == 0){
                throw new CantidadCeroDetalle();
            }

            DetallePago detalle = new DetallePago();
            detalle.setPago(pago);
            detalle.setCantidad(dDTO.getCantidad());
            detalle.setPrecioUnitario(dDTO.getPrecioUnitario());
            detalle.setIdDetallePago(new DetallePagoId(pago.getIdPago(), numero++));

            if (dDTO.getIdProducto() != null) {
                Producto p = productoRepository.findById(dDTO.getIdProducto())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("producto"));
                detalle.setProducto(p);
                p.restarStock(dDTO.getCantidad());
                productoRepository.save(p);

            }

            if (dDTO.getIdMembresia() != null) {
                if (socio == null){
                    throw new ObjetoNoEncontradoException("dni del socio");
                }

                if (pago.getEstado() == EstadoPago.PAGADO) {
                     Membresia membresia = membresiaRepository.findById(dDTO.getIdMembresia())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("membresia"));

                     SocioMembresia nuevaSuscripcion = renovarMembresia(socio, membresia);
                     socio.setActivo(true);
                     detalle.setSocioMembresia(nuevaSuscripcion);
                } else {
                     // For pending/anulled payments, we don't assign membership but we validate existence?
                     // Verify membership exists to avoid FK error if needed?
                     // Details table references SocioMembresia. If null, it's fine.
                     // But we should check if membership ID exists validly?
                     membresiaRepository.findById(dDTO.getIdMembresia())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("membresia"));
                }
            }

            pago.agregarDetalle(detalle);


        }

        if (pago.hayMasDeUnaMembresiaEnDetalle()){
            throw new MasDeUnaMembresiaEnDetalleException();
        }

        BigDecimal monto = dto.getDetalles().stream()
                .map(d -> d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        pago.setMonto(monto);


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
        return pagoRepository.findAllByOrderByFechaDesc()
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

        // Revertir membresías y stock
        for (DetallePago detalle : pago.getDetalles()) {
            if (detalle.getSocioMembresia() != null) {
                // Desactivar la membresía asociada
                SocioMembresia sm = detalle.getSocioMembresia();
                sm.setActivo(false);
                socioMembresiaRepository.save(sm);
                
                // También desactivar el socio si ya no tiene membresías activas
                Socio socio = sm.getSocio();
                if (socio != null && !socioMembresiaRepository.estaActivoHoy(socio.getDni())) {
                    socio.setActivo(false);
                    socioRepository.save(socio);
                }
            }
            
            if (detalle.getProducto() != null && detalle.getCantidad() != null) {
                // Restaurar stock del producto
                Producto producto = detalle.getProducto();
                producto.setStock(producto.getStock() + detalle.getCantidad());
                productoRepository.save(producto);
            }
        }

        pagoRepository.save(pago);
    }

    @Transactional
    public void eliminarPago(Integer id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ObjetoNoEncontradoException("pago"));

        // Revertir membresías y stock antes de eliminar
        for (DetallePago detalle : pago.getDetalles()) {
            if (detalle.getSocioMembresia() != null) {
                // Eliminar físicamente la membresía asociada
                SocioMembresia sm = detalle.getSocioMembresia();
                Socio socio = sm.getSocio();
                
                // Desvincular el detalle de la membresía antes de eliminarla
                detalle.setSocioMembresia(null);
                
                socioMembresiaRepository.delete(sm);
                
                // Desactivar el socio si ya no tiene membresías activas
                if (socio != null && !socioMembresiaRepository.estaActivoHoy(socio.getDni())) {
                    socio.setActivo(false);
                    socioRepository.save(socio);
                }
            }
            
            if (detalle.getProducto() != null && detalle.getCantidad() != null) {
                // Restaurar stock del producto
                Producto producto = detalle.getProducto();
                producto.setStock(producto.getStock() + detalle.getCantidad());
                productoRepository.save(producto);
            }
        }

        // Eliminar físicamente el pago (los detalles se eliminan por CASCADE)
        pagoRepository.delete(pago);
    }

    public List<PagoPorFechaDTO> recaudadoPorDia() {
        return pagoRepository.totalPagosPorFecha();
    }

    public List<PagoPorFechaDTO> recaudadoUltimaSemana() {
        List<Object[]> pagos = pagoRepository.totalPagosUltimaSemana();
        return pagos.stream().map(r -> new PagoPorFechaDTO(
                        ((java.sql.Date) r[0]).toLocalDate(),
                        (BigDecimal) r[1]
                ))
                .collect(Collectors.toList());
    }

    public List<PagoPorMesDTO> recaudadoMeses() {
        List<Object[]> pagos = pagoRepository.totalPagosPorMes();

        return pagos.stream()
                .map(r -> new PagoPorMesDTO(
                        ((Number) r[0]).intValue(), // anio
                        ((Number) r[1]).intValue(), // mes
                        ((BigDecimal) r[2]) // total
                ))
                .collect(Collectors.toList());
    }


    public BigDecimal recaudadoHoy() {
        BigDecimal total = pagoRepository.totalRecaudadoHoy();
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal recaudadoSemana() {
        BigDecimal total = pagoRepository.totalRecaudadoSemana();
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal recaudadoMes() {
        BigDecimal total = pagoRepository.totalRecaudadoMes();
        return total != null ? total : BigDecimal.ZERO;
    }

    public RecaudacionProductosMembresiasMesDTO recaudadoMesProductosPlanes() {
        return new RecaudacionProductosMembresiasMesDTO(
                pagoRepository.totalRecaudadoMesProductos(),
                pagoRepository.totalRecaudadoMesPlanes()
        );
    }

    public ProductoMasVendidoMesDTO productoMasVendidoEnELMes() {
        List<Object[]> result = pagoRepository.productoMasVendidoEnELMes();

        if (result.isEmpty()) {
            return new ProductoMasVendidoMesDTO("Sin ventas", 0);
        }

        Object[] row = result.get(0);

        return new ProductoMasVendidoMesDTO(
                (String) row[0],
                ((Number) row[1]).intValue()
        );
    }


    public PlanMasVendidoMesDTO planMasVendidoEnELMes() {
        List<Object[]> result = pagoRepository.planMasVendidoMensual();

        if (result.isEmpty()) {
            return new PlanMasVendidoMesDTO("Sin ventas", 0);
        }

        Object[] row = result.get(0);

        return new PlanMasVendidoMesDTO(
                (String) row[0],
                ((Number) row[1]).intValue()
        );
    }

    public PagoMesStatsDTO obtenerEstadisticasMensuales() {
        BigDecimal totalMesActual = recaudadoMes();
        
        // Obtener historial de meses
        List<PagoPorMesDTO> historico = recaudadoMeses();
        
        LocalDate fechaActual = LocalDate.now();
        int mesActual = fechaActual.getMonthValue();
        int anioActual = fechaActual.getYear();
        
        int mesAnterior = mesActual - 1;
        int anioAnterior = anioActual;
        if (mesAnterior == 0) {
            mesAnterior = 12;
            anioAnterior--;
        }

        // Buscar total del mes anterior
        final int finalMesAnterior = mesAnterior;
        final int finalAnioAnterior = anioAnterior;
        
        BigDecimal totalMesAnterior = historico.stream()
            .filter(h -> h.mes().equals(finalMesAnterior) && h.anio().equals(finalAnioAnterior))
            .map(PagoPorMesDTO::monto)
            .findFirst()
            .orElse(BigDecimal.ZERO);

        Double variacion = null;

        if (totalMesAnterior.compareTo(BigDecimal.ZERO) > 0) {
            // ((Actual - Anterior) / Anterior) * 100
            BigDecimal diferencia = totalMesActual.subtract(totalMesAnterior);
            BigDecimal var = diferencia.divide(totalMesAnterior, 4, java.math.RoundingMode.HALF_UP)
                                       .multiply(BigDecimal.valueOf(100));
            variacion = var.doubleValue();
        } else if (totalMesActual.compareTo(BigDecimal.ZERO) > 0) {
            // Si el mes anterior fue 0 y este tiene ventas, es un aumento "infinito", 
            // pero lo representaremos como 100% o null según regla de negocio. 
            // El usuario pidió que se muestre > 100% si aplica.
            variacion = 100.0; 
        } else {
            // 0 vs 0 es 0% variación
            variacion = 0.0;
        }

        return new PagoMesStatsDTO(totalMesActual, variacion);
    }
}


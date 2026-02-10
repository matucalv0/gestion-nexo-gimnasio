package com.nexo.gestion.services;

import com.nexo.gestion.dto.GastoDTO;
import com.nexo.gestion.entity.Gasto;
import com.nexo.gestion.entity.MedioPago;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.GastoRepository;
import com.nexo.gestion.repository.MedioPagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class GastoService {
    private final GastoRepository gastoRepository;
    private final MedioPagoRepository medioPagoRepository;

    public GastoService(GastoRepository gastoRepository, MedioPagoRepository medioPagoRepository) {
        this.gastoRepository = gastoRepository;
        this.medioPagoRepository = medioPagoRepository;
    }

    private GastoDTO convertirAGastoDTO(Gasto gasto) {
        return new GastoDTO(
                gasto.getFecha(),
                gasto.getMonto(),
                gasto.getCategoria(),
                gasto.getProveedor(),
                gasto.getMedioPago() != null ? gasto.getMedioPago().getIdMedioPago() : null);
    }

    @Transactional
    public GastoDTO registrarGasto(GastoDTO gastoDTO) {
        if (gastoDTO.idMedioPago() == null) {
            throw new ObjetoNoEncontradoException("El medio de pago es obligatorio");
        }

        MedioPago medioPago = medioPagoRepository.findById(gastoDTO.idMedioPago())
                .orElseThrow(() -> new ObjetoNoEncontradoException(gastoDTO.idMedioPago() + " id no encontrado"));

        Gasto gasto = new Gasto(
                gastoDTO.monto(),
                gastoDTO.categoria(),
                gastoDTO.proveedor(),
                medioPago);

        Gasto guardado = gastoRepository.save(gasto);
        return convertirAGastoDTO(guardado);

    }

    public List<GastoDTO> buscarGastos() {
        List<GastoDTO> gastos = new ArrayList<>();

        for (Gasto g : gastoRepository.findByActivoTrueOrderByFechaDesc()) {
            gastos.add(new GastoDTO(g.getFecha(), g.getMonto(), g.getCategoria(), g.getProveedor(),
                    g.getMedioPago() != null ? g.getMedioPago().getIdMedioPago() : null));
        }

        return gastos;
    }

    @Transactional
    public void eliminarGasto(Integer id) {
        Gasto gasto = gastoRepository.findById(id)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Gasto con id " + id + " no encontrado"));
        gasto.setActivo(false);
        gastoRepository.save(gasto);
    }

}

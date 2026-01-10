package com.nexo.gestion.services;

import com.nexo.gestion.dto.AsistenciaDTO;
import com.nexo.gestion.dto.AsistenciaSocioIdDTO;
import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.AsistenciaSocioId;
import com.nexo.gestion.repository.AsistenciaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AsistenciaService {
    private final AsistenciaRepository asistenciaRepository;

    public AsistenciaService(AsistenciaRepository asistenciaRepository){
        this.asistenciaRepository = asistenciaRepository;
    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a){
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFechaHora()
        );
    }

    private AsistenciaDTO convertirAAsistenciaDTO(Asistencia a){
        return new AsistenciaDTO(
                a.getSocio().getNombre(),
                a.getSocio().getDni(),
                a.getIdAsistencia().getFechaHora()

        );
    }


    public List<AsistenciaDTO> buscarAsistencias(){
        List<AsistenciaDTO> asistencias = new ArrayList<>();
        for (Asistencia asistencia: asistenciaRepository.findAllOrdenadoPorFecha()){
            AsistenciaDTO asistenciaDTO = convertirAAsistenciaDTO(asistencia);
            asistencias.add(asistenciaDTO);
        }

        return asistencias;
    }

    public List<AsistenciaDTO> buscarAsistencia(String dniOrNombre) {
        List<AsistenciaDTO> asistencias = new ArrayList<>();

        for (Asistencia asistencia: asistenciaRepository.buscarPorNombreODni(dniOrNombre)){
            AsistenciaDTO asistenciaDTO = convertirAAsistenciaDTO(asistencia);
            asistencias.add(asistenciaDTO);
        }

        return asistencias;
    }






}

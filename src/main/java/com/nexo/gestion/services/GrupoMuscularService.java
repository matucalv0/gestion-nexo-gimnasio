package com.nexo.gestion.services;

import com.nexo.gestion.dto.GrupoMuscularDTO;
import com.nexo.gestion.entity.GrupoMuscular;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.repository.GrupoMuscularRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GrupoMuscularService {
    private final GrupoMuscularRepository grupoMuscularRepository;

    public GrupoMuscularService(GrupoMuscularRepository grupoMuscularRepository){
        this.grupoMuscularRepository = grupoMuscularRepository;
    }

    private GrupoMuscularDTO convertirAGrupoMuscularDTO(GrupoMuscular grupoMuscular){
        return new GrupoMuscularDTO(grupoMuscular.getIdGrupo(), grupoMuscular.getNombre());
    }

    public GrupoMuscularDTO registrarGrupoMuscular(GrupoMuscularDTO grupoMuscular){
        if (grupoMuscularRepository.existsByNombre(grupoMuscular.nombre())){
            throw new ObjetoDuplicadoException("Ya existe el grupo " + grupoMuscular.nombre());
        }

        GrupoMuscular nuevoGrupoMuscular = new GrupoMuscular(grupoMuscular.nombre());
        GrupoMuscular guardado = grupoMuscularRepository.save(nuevoGrupoMuscular);

        return convertirAGrupoMuscularDTO(guardado);
    }

    public List<GrupoMuscularDTO> buscarGruposMusculares() {
        List<GrupoMuscularDTO> grupos = new ArrayList<>();

        for (GrupoMuscular grupoMuscular: grupoMuscularRepository.findAll()){
            GrupoMuscularDTO grupoMuscularDTO = convertirAGrupoMuscularDTO(grupoMuscular);
            grupos.add(grupoMuscularDTO);
        }

        return grupos;
    }
}

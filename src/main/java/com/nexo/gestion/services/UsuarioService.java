package com.nexo.gestion.services;


import com.nexo.gestion.dto.UsuarioDTO;
import com.nexo.gestion.dto.UsuarioResponseDTO;
import com.nexo.gestion.entity.Empleado;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.Usuario;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.EmpleadoRepository;
import com.nexo.gestion.repository.SocioRepository;
import com.nexo.gestion.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository,EmpleadoRepository empleadoRepository, SocioRepository socioRepository, PasswordEncoder passwordEncoder){
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.empleadoRepository = empleadoRepository;
        this.socioRepository = socioRepository;
    }

    private UsuarioResponseDTO convertirAUsuarioDTO(Usuario usuario, String dni) {
        return new UsuarioResponseDTO(
                usuario.getUsername(),
                usuario.getRol(),
                dni
        );
    }

    @Transactional
    public UsuarioResponseDTO registrarUsuario(UsuarioDTO usuarioDTO){
        if (usuarioRepository.existsByUsername(usuarioDTO.username())){
            throw new ObjetoDuplicadoException(usuarioDTO.username());
        }

        Usuario nuevoUsuario = new Usuario(usuarioDTO.username());

        if (usuarioDTO.password() == null || usuarioDTO.password().length() < 8) {
            throw new IllegalStateException("La contraseña debe tener al menos 8 caracteres");
        }

        nuevoUsuario.setPassword(passwordEncoder.encode(usuarioDTO.password()));


        switch (usuarioDTO.rol()){
            case SOCIO -> {
                Socio socio = socioRepository.findById(usuarioDTO.dni()).orElseThrow(() -> new ObjetoNoEncontradoException(usuarioDTO.dni()));
                nuevoUsuario.setSocio(socio);
                nuevoUsuario.setRol(usuarioDTO.rol());
            }
            case EMPLEADO -> {
                Empleado empleado = empleadoRepository.findById(usuarioDTO.dni()).orElseThrow(() -> new ObjetoNoEncontradoException(usuarioDTO.dni()));
                nuevoUsuario.setEmpleado(empleado);
                nuevoUsuario.setRol(usuarioDTO.rol());
            }
            case ADMIN -> nuevoUsuario.setRol(usuarioDTO.rol());

        }


        Usuario guardado = usuarioRepository.save(nuevoUsuario);
        return convertirAUsuarioDTO(guardado, usuarioDTO.dni());

    }

    public List<UsuarioResponseDTO> buscarUsuarios(){
        List<UsuarioResponseDTO> usuarios = new ArrayList<>();
        for (Usuario usuario: usuarioRepository.findAll()){
            String dni = null;

            if (usuario.getEmpleado() != null){
                dni = usuario.getEmpleado().getDni();
            }

            if (usuario.getSocio() != null){
                dni = usuario.getSocio().getDni();
            }

            UsuarioResponseDTO usuarioDTO = convertirAUsuarioDTO(usuario, dni);
            usuarios.add(usuarioDTO);
        }

        return usuarios;
    }
}

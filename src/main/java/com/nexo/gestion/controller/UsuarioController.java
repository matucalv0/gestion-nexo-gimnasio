package com.nexo.gestion.controller;

import com.nexo.gestion.dto.UsuarioDTO;
import com.nexo.gestion.dto.UsuarioResponseDTO;
import com.nexo.gestion.services.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService){
        this.usuarioService = usuarioService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> altaUsuario(@Valid @RequestBody UsuarioDTO usuarioDTO){
        UsuarioResponseDTO usuario = usuarioService.registrarUsuario(usuarioDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> mostrarUsuarios(){
        List<UsuarioResponseDTO> usuarios = usuarioService.buscarUsuarios();
        return ResponseEntity.ok(usuarios);
    }
}

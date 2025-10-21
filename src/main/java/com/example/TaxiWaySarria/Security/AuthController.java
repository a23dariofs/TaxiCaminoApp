package com.example.TaxiWaySarria.Security;

import com.example.TaxiWaySarria.Model.Usuario;
import com.example.TaxiWaySarria.Repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authManager, UsuarioRepository usuarioRepository,
                          JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.authManager = authManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
            Usuario usuario = usuarioRepository.findByUsername(username).get();
            String token = jwtUtil.generateToken(usuario.getUsername(), usuario.getRole());
            return ResponseEntity.ok(Map.of("token", token));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Usuario o contraseña incorrectos");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role");

        if (usuarioRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Usuario ya existe");
        }

        // Crear el usuario usando constructor normal
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setRole(role);

        usuarioRepository.save(usuario);
        return ResponseEntity.ok("Usuario creado correctamente");
    }

    @GetMapping("/ping")
    public String ping() {
        return "Servidor funcionando";
    }
}

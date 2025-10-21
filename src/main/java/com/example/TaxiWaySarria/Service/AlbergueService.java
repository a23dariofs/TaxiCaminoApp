package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Albergue;
import com.example.TaxiWaySarria.Repository.AlbergueRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlbergueService {

    private final AlbergueRepository albergueRepository;

    public AlbergueService(AlbergueRepository albergueRepository) {
        this.albergueRepository = albergueRepository;
    }

    public List<Albergue> listarTodos() {
        return albergueRepository.findAll();
    }

    public Albergue buscarPorId(Long id) {
        return albergueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Albergue no encontrado con id: " + id));
    }

    public Albergue crear(Albergue albergue) {
        return albergueRepository.save(albergue);
    }

    public Albergue actualizar(Long id, Albergue albergueActualizado) {
        Albergue albergue = buscarPorId(id);
        albergue.setNombre(albergueActualizado.getNombre());
        albergue.setDireccion(albergueActualizado.getDireccion());
        albergue.setCiudad(albergueActualizado.getCiudad());
        albergue.setProvincia(albergueActualizado.getProvincia());
        return albergueRepository.save(albergue);
    }

    public void eliminar(Long id) {
        albergueRepository.deleteById(id);
    }

    public List<Albergue> buscarPorCiudad(String ciudad) {
        return albergueRepository.findByCiudad(ciudad);
    }

    public List<Albergue> buscarPorProvincia(String provincia) {
        return albergueRepository.findByProvincia(provincia);
    }
}
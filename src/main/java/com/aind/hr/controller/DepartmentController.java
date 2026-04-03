package com.aind.hr.controller;

import com.aind.hr.model.entity.Department;
import com.aind.hr.model.request.DepartmentCreateRequest;
import com.aind.hr.model.request.DepartmentUpdateRequest;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/v1/departments")
@Tag(name = "department", description = "부서 API")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "부서 목록 조회", description = "전체 부서 목록을 조회합니다.")
    public ResponseEntity<List<Department>> getDepartmentList() {
        return ResponseEntity.ok(departmentService.getDepartmentList());
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "부서 상세 조회", description = "부서 ID로 상세 정보를 조회합니다.")
    public ResponseEntity<Department> getDepartment(@PathVariable Integer id) {
        return ResponseEntity.ok(departmentService.getDepartment(id));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "부서 등록", description = "새로운 부서를 등록합니다.")
    public ResponseEntity<UpdateResponse> createDepartment(
            @Valid @RequestBody DepartmentCreateRequest request) {
        Department department = new Department();
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        return new ResponseEntity<>(departmentService.createDepartment(department), HttpStatus.CREATED);
    }

    @PutMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "부서 수정", description = "부서 정보를 수정합니다.")
    public ResponseEntity<UpdateResponse> updateDepartment(
            @Valid @RequestBody DepartmentUpdateRequest request) {
        Department department = new Department();
        department.setId(request.getId());
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        return ResponseEntity.ok(departmentService.updateDepartment(department));
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "부서 삭제", description = "부서를 삭제합니다.")
    public ResponseEntity<UpdateResponse> deleteDepartment(@PathVariable Integer id) {
        return ResponseEntity.ok(departmentService.deleteDepartment(id));
    }
}

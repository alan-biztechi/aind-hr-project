package com.aind.hr.controller;

import com.aind.hr.model.entity.Employee;
import com.aind.hr.model.request.EmployeeCreateRequest;
import com.aind.hr.model.request.EmployeeUpdateRequest;
import com.aind.hr.model.response.EmployeeResponse;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.service.EmployeeService;
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
@RequestMapping("/v1/employees")
@Tag(name = "employee", description = "직원 API")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "직원 목록 조회", description = "전체 직원 목록을 부서 정보와 함께 조회합니다.")
    public ResponseEntity<List<EmployeeResponse>> getEmployeeList() {
        return ResponseEntity.ok(employeeService.getEmployeeList());
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "직원 상세 조회", description = "직원 ID로 부서 정보 포함 상세 정보를 조회합니다.")
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable Integer id) {
        return ResponseEntity.ok(employeeService.getEmployeeWithDepartment(id));
    }

    @GetMapping(value = "/department/{departmentId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "부서별 직원 조회", description = "특정 부서에 속한 직원 목록을 조회합니다.")
    public ResponseEntity<List<Employee>> getEmployeesByDepartment(@PathVariable Integer departmentId) {
        return ResponseEntity.ok(employeeService.getEmployeesByDepartment(departmentId));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "직원 등록", description = "새로운 직원을 등록합니다.")
    public ResponseEntity<UpdateResponse> createEmployee(
            @Valid @RequestBody EmployeeCreateRequest request) {
        Employee employee = new Employee();
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setDepartmentId(request.getDepartmentId());
        employee.setPosition(request.getPosition());
        employee.setHireDate(request.getHireDate());
        return new ResponseEntity<>(employeeService.createEmployee(employee), HttpStatus.CREATED);
    }

    @PutMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "직원 수정", description = "직원 정보를 수정합니다.")
    public ResponseEntity<UpdateResponse> updateEmployee(
            @Valid @RequestBody EmployeeUpdateRequest request) {
        Employee employee = new Employee();
        employee.setId(request.getId());
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setDepartmentId(request.getDepartmentId());
        employee.setPosition(request.getPosition());
        employee.setStatus(request.getStatus());
        return ResponseEntity.ok(employeeService.updateEmployee(employee));
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "직원 삭제", description = "직원을 삭제합니다.")
    public ResponseEntity<UpdateResponse> deleteEmployee(@PathVariable Integer id) {
        return ResponseEntity.ok(employeeService.deleteEmployee(id));
    }
}

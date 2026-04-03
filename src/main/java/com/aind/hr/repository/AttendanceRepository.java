package com.aind.hr.repository;

import com.aind.hr.model.entity.Attendance;
import com.aind.hr.model.response.AttendanceResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AttendanceRepository {

    List<Attendance> selectAll();

    List<Attendance> selectByEmployeeId(@Param("employeeId") Integer employeeId);

    List<Attendance> selectByWorkDate(@Param("workDate") LocalDate workDate);

    Attendance selectById(@Param("id") Integer id);

    List<AttendanceResponse> selectAllWithEmployee();

    int insert(Attendance attendance);

    int updateCheckOut(@Param("id") Integer id,
                       @Param("checkOut") java.time.LocalTime checkOut);
}
